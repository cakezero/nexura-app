import fs from 'fs';
let c = fs.readFileSync('src/pages/studio/user/UserSignup.tsx', 'utf8');
console.log('handleSubmit at:', c.indexOf('handleSubmit'));
console.log('handleSignUp at:', c.indexOf('handleSignUp'));
console.log('handleSendOtp at:', c.indexOf('handleSendOtp'));
console.log('OTP Step at:', c.indexOf('OTP Step'));
console.log('OtpVerification at:', c.indexOf('OtpVerification'));
