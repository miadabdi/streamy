'use strict';
var __decorate =
	(this && this.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d;
		if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
			r = Reflect.decorate(decorators, target, key, desc);
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		return (c > 3 && r && Object.defineProperty(target, key, r), r);
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.DependentFields = exports.DependentFieldsOperation = void 0;
const class_validator_1 = require('class-validator');
var DependentFieldsOperation;
(function (DependentFieldsOperation) {
	DependentFieldsOperation[(DependentFieldsOperation['NotEquel'] = 0)] = 'NotEquel';
})(DependentFieldsOperation || (exports.DependentFieldsOperation = DependentFieldsOperation = {}));
let DependentFields = class DependentFields {
	validate(value, args) {
		const operation = args.constraints[0];
		const dependentField = args.constraints[1];
		if (operation == DependentFieldsOperation.NotEquel) {
			if (value === args.object[dependentField]) return false;
		}
		return true;
	}
	defaultMessage(args) {
		return 'Default Message, Value: ($value)';
	}
};
exports.DependentFields = DependentFields;
exports.DependentFields = DependentFields = __decorate(
	[(0, class_validator_1.ValidatorConstraint)({ name: 'dependentFields', async: false })],
	DependentFields,
);
//# sourceMappingURL=validate-dependent-fields.js.map
