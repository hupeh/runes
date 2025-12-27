import { describe, expect, it, vi } from "vitest";
import fakerestDataProvider from "./index";

describe("ra-data-fakerest", () => {
  describe("getMany", () => {
    it("应该返回与给定 id 匹配的记录", async () => {
      const dataProvider = fakerestDataProvider({
        posts: [
          { id: 0, title: "Hello, world!" },
          { id: 1, title: "FooBar" },
          { id: 2, title: "Goodbye, world!" },
        ],
      });
      const { data } = await dataProvider.getMany("posts", {
        ids: [1, 2],
      });
      expect(data).toEqual([
        { id: 1, title: "FooBar" },
        { id: 2, title: "Goodbye, world!" },
      ]);
    });
    it("应该保留 id 的顺序", async () => {
      const dataProvider = fakerestDataProvider({
        posts: [
          { id: 0, title: "Hello, world!" },
          { id: 1, title: "FooBar" },
          { id: 2, title: "Goodbye, world!" },
        ],
      });
      const { data } = await dataProvider.getMany("posts", {
        ids: [2, 0],
      });
      expect(data).toEqual([
        { id: 2, title: "Goodbye, world!" },
        { id: 0, title: "Hello, world!" },
      ]);
    });
    it("当没有提供 id 时应该返回空结果", async () => {
      const dataProvider = fakerestDataProvider({
        posts: [
          { id: 0, title: "Hello, world!" },
          { id: 1, title: "FooBar" },
          { id: 2, title: "Goodbye, world!" },
        ],
      });
      const { data } = await dataProvider.getMany("posts", {
        ids: [],
      });
      expect(data).toEqual([]);
    });
    it("当请求不存在的 id 时应该返回错误", async () => {
      vi.spyOn(console, "error").mockImplementationOnce(() => {});
      const dataProvider = fakerestDataProvider({
        posts: [
          { id: 0, title: "Hello, world!" },
          { id: 1, title: "FooBar" },
          { id: 2, title: "Goodbye, world!" },
        ],
      });
      expect(async () => {
        await dataProvider.getMany("posts", { ids: [0, 3] });
      }).rejects.toThrow();
    });
  });
});
