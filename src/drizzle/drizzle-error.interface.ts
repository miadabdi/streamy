export default interface IDrizzleError {
	length: number;
	severity: string;
	code: string;
	detail: string;
	hint: any;
	position: any;
	internalPosition: any;
	internalQuery: any;
	where: any;
	schema: string;
	table: string;
	column: any;
	dataType: any;
	constraint: string;
	file: string;
	line: string;
	routine: string;
}
