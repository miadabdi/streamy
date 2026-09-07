'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.SignInDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const sign_up_dto_1 = require('./sign-up.dto');
class SignInDto extends (0, swagger_1.OmitType)(sign_up_dto_1.SignUpDto, ['channel']) {}
exports.SignInDto = SignInDto;
//# sourceMappingURL=sign-in.dto.js.map
