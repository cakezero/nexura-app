import fs from 'fs';

let c = fs.readFileSync('src/pages/studio/user/UserSignup.tsx', 'utf8');
let lines = c.split('\r\n');

let sendOtpStart = -1, sendOtpEnd = -1, signUpStart = -1, signUpEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('handleSendOtp = async')) {
    sendOtpStart = i;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '};') { sendOtpEnd = j; break; }
    }
    break;
  }
}

for (let i = sendOtpEnd + 1; i < lines.length; i++) {
  if (lines[i].includes('handleSignUp = async')) {
    signUpStart = i;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '};') { signUpEnd = j; break; }
    }
    break;
  }
}

console.log('Boundaries:', sendOtpStart, sendOtpEnd, signUpStart, signUpEnd);

const b = '`'; // backtick
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
  '      await apiRequestV2("POST", ' + b + '/hub-auth/validate-email?email=${encodeURIComponent(email)}&page=user' + b + ');',
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
  '      setLocation(' + b + '/studio/verify-otp?email=${encodeURIComponent(email)}&page=user' + b + ');',
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
c = c.replace('onClick={handleSignUp}', 'onClick={handleSubmit}');
fs.writeFileSync('src/pages/studio/user/UserSignup.tsx', c);
console.log('Done');
