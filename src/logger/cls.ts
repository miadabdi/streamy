import { Injectable } from '@nestjs/common';
import { CLS_ID, ClsService } from 'nestjs-cls';

export interface ContextStorageService {
	setContextId(contextId: string): void;
	getContextId(): string;
	get<T>(key: string): T | undefined;
	set<T>(key: string, value: T): void;
}

@Injectable()
export class NestjsClsContextStorageService implements ContextStorageService {
	constructor(private readonly cls: ClsService) {}

	public get<T>(key: string): T | undefined {
		return this.cls.get(key);
	}

	public setContextId(id: string) {
		this.cls.set(CLS_ID, id);
	}

	public getContextId(): string | undefined {
		return this.cls.getId();
	}

	public set<T>(key: string, value: T): void {
		this.cls.set(key, value);
	}
}
