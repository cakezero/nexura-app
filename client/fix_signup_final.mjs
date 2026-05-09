import fs from 'fs';

let c = fs.readFileSync('src/pages/studio/user/UserSignup.tsx', 'utf8');
let lines = c.split('\r\n');

let sendOtpStart = -1;
let sendOtpEnd = -1;
let signUpStart = -1;
let signUpEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('handleSendOtp')) sendOtpStart = i;
  if (sendOtpStart !== -1 && lines[i].trim() === '}' && i > sendOtpStart + 30) {
    sendOtpEnd = i;
    break;
  }
}

for (let i = sendOtpEnd + 1; i < lines.length; i++) {
  if (lines[i].includes('handleSignUp')) {
    signUpStart = i;
    break;
  }
}

let braceCount = 0;
let foundFuncStart = false;
for (let i = signUpStart; i < lines.length; i++) {
  braceCount += (lines[i].match(/\{/g) || []).length;
  braceCount -= (lines[i].match(/\}/g) || []).length;
  if (braceCount > 0) foundFuncStart = true;
  if (foundFuncStart && braceCount === 0) {
    signUpEnd = i;
    break;
  }
}

console.log('sendOtpStart:', sendOtpStart, 'sendOtpEnd:', sendOtpEnd);
console.log('signUpStart:', signUpStart, 'signUpEnd:', signUpEnd);

const newHandler = [
  '  const handleSubmit = async () => {',
  '    if (!email || !password || !confirmPassword) {',
  '      toast({',
  '        title: "Missing fields",',
  '        description: "Please fill in all fields.",',
  '        variant: "destructive",',
  '      });',
  '      return;',
  '    }',
  '',
  '    if (password !== confirmPassword) {',
  '      toast({',
  '        title: "Passwords mismatch",',
  '        description: "Password and confirm password must match.",',
  '        variant: "destructive",',
  '      });',
  '      return;',
  '    }',
  '',
  '    if (!walletAddress) {',
  '      toast({',
  '        title: "Wallet not connected",',
  '        description: "Please connect your wallet to continue.",',
  '        variant: "destructive",',
  '      });',
  '      return;',
  '    }',
  '',
  '    setCreating(true);',
  '    try {',
  '      await apiRequestV2("POST", `/hub-auth/validate-email?email=${encodeURIComponent(email)}&page=user`);',
  '',
  '      sessionStorage.setItem("nexura:pending-signup", JSON.stringify({',
  '        email,',
  '        password,',
  '        name: mainAppUsername || walletAddress,',
  '        page: "user",',
  '        walletAddress,',
  '        mainAppUsername,',
  '      }));',
  '',
  '      setLocation(`/studio/verify-otp?email=${encodeURIComponent(email)}&page=user`);',
  '    } catch (err: any) {',
  '      toast({',
  '        title: "Failed to send OTP",',
  '        description: err?.error || err?.message || "Something went wrong.",',
  '        variant: "destructive",',
  '      });',
  '    } finally {',
  '      setCreating(false);',
  '    }',
  '  };',
];

let newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (i === sendOtpStart) {
    newLines.push(...newHandler);
    i = signUpEnd;
    continue;
  }
  newLines.push(lines[i]);
}

c = newLines.join('\r\n');

// Fix button onClick
c = c.replace('onClick={handleSignUp}', 'onClick={handleSubmit}');

fs.writeFileSync('src/pages/studio/user/UserSignup.tsx', c);
console.log('Done');
