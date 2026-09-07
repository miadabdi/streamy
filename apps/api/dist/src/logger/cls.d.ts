import { ClsService } from 'nestjs-cls';
export interface ContextStorageService {
	setContextId(contextId: string): void;
	getContextId(): string | undefined;
	get<T>(key: string): T | undefined;
	set<T>(key: string, value: T): void;
}
export declare class NestjsClsContextStorageService implements ContextStorageService {
	private readonly cls;
	constructor(cls: ClsService);
	get<T>(key: string): T | undefined;
	setContextId(id: string): void;
	getContextId(): string | undefined;
	set<T>(key: string, value: T): void;
}
