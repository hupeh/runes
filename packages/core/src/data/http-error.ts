export class HttpError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly body: any = null,
	) {
		super(message);
		this.status = status;
		this.body = body;
		Object.setPrototypeOf(this, HttpError.prototype);
		this.name = this.constructor.name;
		if (typeof Error.captureStackTrace === "function") {
			Error.captureStackTrace(this, this.constructor);
		} else {
			this.stack = new Error(message).stack;
		}
	}
}
