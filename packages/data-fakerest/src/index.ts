import type { DataProvider } from "@runes/core";
import { Database } from "fakerest";

function log(
  type: string,
  resource: string,
  params: unknown,
  response: unknown,
) {
  // @ts-expect-error
  if (console.group) {
    // Chrome 中更好的日志记录方式
    console.groupCollapsed(type, resource, JSON.stringify(params));
    console.log(response);
    console.groupEnd();
  } else {
    console.log("FakeRest request ", type, resource, params);
    console.log("FakeRest response", response);
  }
}

function delayed<T>(response: T, delay?: number): T | Promise<T> {
  // 如果没有延迟，立即返回值
  // 这在单元测试中可以节省一个 tick
  return delay
    ? new Promise((resolve) => {
        setTimeout(() => resolve(response), delay);
      })
    : response;
}

/**
 * 使用本地 JavaScript 对象响应 react-admin 数据查询
 *
 * 适用于调试和测试 - 不要在生产环境中使用
 *
 * @example
 *
 * import fakeDataProvider from 'ra-data-fakerest';
 * const dataProvider = fakeDataProvider({
 *   posts: [
 *     { id: 0, title: 'Hello, world!' },
 *     { id: 1, title: 'FooBar' },
 *   ],
 *   comments: [
 *     { id: 0, post_id: 0, author: 'John Doe', body: 'Sensational!' },
 *     { id: 1, post_id: 0, author: 'Jane Doe', body: 'I agree' },
 *   ],
 * })
 */
export default (
  data: Record<string, unknown[]>,
  loggingEnabled = false,
  delay?: number,
): DataProvider => {
  const database = new Database({ data });
  if (typeof window !== "undefined") {
    // 允许在控制台中更新数据
    (window as any)._database = database;
  }

  function getResponse(type: string, resource: string, params: any) {
    switch (type) {
      case "getList": {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
          sort: [field, order] as [string, "asc" | "desc"],
          range: [(page - 1) * perPage, page * perPage - 1] as [number, number],
          filter: params.filter,
          embed: getEmbedParam(params.meta?.embed, params.meta?.prefetch),
        };
        const data = database.getAll(resource, query);
        const prefetched = getPrefetchedData(data, params.meta?.prefetch);
        return delayed(
          {
            data: removePrefetchedData(data, params.meta?.prefetch),
            total: database.getCount(resource, {
              filter: params.filter,
            }),
            meta: params.meta?.prefetch ? { prefetched } : undefined,
          },
          delay,
        );
      }
      case "getOne": {
        const data = database.getOne(resource, params.id, {
          ...params,
          embed: getEmbedParam(params.meta?.embed, params.meta?.prefetch),
        });
        const prefetched = getPrefetchedData(data, params.meta?.prefetch);
        return delayed(
          {
            data: removePrefetchedData(data, params.meta?.prefetch),
            meta: params.meta?.prefetch ? { prefetched } : undefined,
          },
          delay,
        );
      }
      case "getMany": {
        const data = params.ids.map((id: string | number) =>
          database.getOne(resource, id, {
            ...params,
            embed: getEmbedParam(params.meta?.embed, params.meta?.prefetch),
          }),
        );
        const prefetched = getPrefetchedData(data, params.meta?.prefetch);
        return delayed(
          {
            data: removePrefetchedData(data, params.meta?.prefetch),
            meta: params.meta?.prefetch ? { prefetched } : undefined,
          },
          delay,
        );
      }
      case "getManyReference": {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
          sort: [field, order] as [string, "asc" | "desc"],
          range: [(page - 1) * perPage, page * perPage - 1] as [number, number],
          filter: { ...params.filter, [params.target]: params.id },
          embed: getEmbedParam(params.meta?.embed, params.meta?.prefetch),
        };
        const data = database.getAll(resource, query);
        const prefetched = getPrefetchedData(data, params.meta?.prefetch);
        return delayed(
          {
            data: removePrefetchedData(data, params.meta?.prefetch),
            total: database.getCount(resource, {
              filter: query.filter,
            }),
            meta: params.meta?.prefetch ? { prefetched } : undefined,
          },
          delay,
        );
      }
      case "update":
        return delayed(
          {
            data: database.updateOne(
              resource,
              params.id,
              cleanupData(params.data),
            ),
          },
          delay,
        );
      case "updateMany":
        for (const id of params.ids) {
          database.updateOne(resource, id, cleanupData(params.data));
        }
        return delayed({ data: params.ids }, delay);
      case "create":
        return delayed(
          {
            data: database.addOne(resource, cleanupData(params.data)),
          },
          delay,
        );
      case "delete":
        return delayed(
          { data: database.removeOne(resource, params.id) },
          delay,
        );
      case "deleteMany":
        for (const id of params.ids) {
          database.removeOne(resource, id);
        }
        return delayed({ data: params.ids }, delay);
      default:
        return false;
    }
  }

  /**
   * @param {String} type 数据提供者方法之一，例如 'getList'
   * @param {String} resource 要获取的资源名称，例如 'posts'
   * @param {Object} params 数据请求参数，根据类型而定
   * @returns {Promise} 响应结果
   */
  const handle = async (
    type: string,
    resource: string,
    params: any,
  ): Promise<any> => {
    const collection = database.getCollection(resource);
    if (!collection && type !== "create") {
      const error = new UndefinedResourceError(
        `Undefined collection "${resource}"`,
      );
      error.code = 1; // 使该错误可检测
      throw error;
    }
    let response: unknown;
    try {
      response = await getResponse(type, resource, params);
    } catch (error) {
      console.error(error);
      throw error;
    }
    if (loggingEnabled) {
      const { signal, ...paramsWithoutSignal } = params;
      log(type, resource, paramsWithoutSignal, response);
    }
    return response;
  };

  return {
    getList: (resource, params) => handle("getList", resource, params),
    getOne: (resource, params) => handle("getOne", resource, params),
    getMany: (resource, params) => handle("getMany", resource, params),
    getManyReference: (resource, params) =>
      handle("getManyReference", resource, params),
    update: (resource, params) => handle("update", resource, params),
    updateMany: (resource, params) => handle("updateMany", resource, params),
    create: (resource, params) => handle("create", resource, params),
    delete: (resource, params) => handle("delete", resource, params),
    deleteMany: (resource, params) => handle("deleteMany", resource, params),
  };
};

function getEmbedParam(embed: string[], prefetch: string[]) {
  if (!embed && !prefetch) return;
  const param = new Set<string>();
  embed?.forEach((e) => {
    param.add(e);
  });
  prefetch?.forEach((e) => {
    param.add(e);
  });
  return Array.from(param);
}

/**
 * 从 FakeRest 响应中提取嵌入数据
 *
 * 当调用 FakeRest database.getOne('comments', 123, { embed: 'post' }) 时，
 * FakeRest 响应会在响应中添加一个 `post` 键，包含相关的文章数据。例如：
 *
 *     { id: 123, body: 'Nice post!', post: { id: 1, title: 'Hello, world' } }
 *
 * 我们希望将所有嵌入数据复制到一个数据对象中，该对象稍后会被
 * 包含到响应的 meta.prefetched 键中。
 *
 * @example getPrefetchedData({ id: 123, body: 'Nice post!', post: { id: 1, title: 'Hello, world' } }, ['post'])
 * // {
 * //   posts: [{ id: 1, title: 'Hello, world' }] }
 * // }
 */
const getPrefetchedData = (data: any, prefetchParam?: string[]) => {
  if (!prefetchParam) return undefined;
  const prefetched: Record<string, any[]> = {};
  const dataArray = Array.isArray(data) ? data : [data];
  prefetchParam.forEach((name) => {
    const resource = name.endsWith("s") ? name : `${name}s`;
    dataArray.forEach((record) => {
      if (!prefetched[resource]) {
        prefetched[resource] = [];
      }
      if (prefetched[resource].some((r: any) => r.id === record[name].id)) {
        // 如果记录已经存在，则不添加
        return;
      }
      prefetched[resource].push(record[name]);
    });
  });

  return prefetched;
};

/**
 * 从 FakeRest 响应中移除嵌入数据
 *
 * 当调用 FakeRest database.getOne('comments', 123, { embed: 'post' }) 时，
 * FakeRest 响应会在响应中添加一个 `post` 键，包含相关的文章数据。例如：
 *
 *     { id: 123, body: 'Nice post!', post: { id: 1, title: 'Hello, world' } }
 *
 * 我们希望从响应中移除所有嵌入数据。
 *
 * @example removePrefetchedData({ id: 123, body: 'Nice post!', post: { id: 1, title: 'Hello, world' } }, 'post')
 * // { id: 123, body: 'Nice post!' }
 */
const removePrefetchedData = (data: any, prefetchParam?: string[]) => {
  if (!prefetchParam) return data;
  const dataArray = Array.isArray(data) ? data : [data];
  const newDataArray = dataArray.map((record) => {
    const newRecord: Record<string, any> = {};
    for (const key in record) {
      if (!prefetchParam.includes(key)) {
        newRecord[key] = record[key];
      }
    }
    return newRecord;
  });
  return Array.isArray(data) ? newDataArray : newDataArray[0];
};

/**
 * 克隆数据并忽略 undefined 值
 *
 * 如果不这样做，使用 { id: undefined } 作为载荷的更新
 * 会从记录中移除 id，而真实的数据提供者不会这样做。
 *
 * 此外，这也确保我们不保留对数据的引用，
 * 并且数据不会被修改。
 */
const cleanupData = <T>(data: T): T => JSON.parse(JSON.stringify(data));

class UndefinedResourceError extends Error {
  code = 0;
}
