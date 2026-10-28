"use client";

import type { ReactNode } from "react";
import { LEGAL_UPDATED, MIN_AGE, PRIVACY_URL } from "@/lib/legal";

const Item = ({ label, children }: { label: string; children: ReactNode }) => (
  <li>
    <span className="text-[#8B3EFE] font-medium">• {label}:</span>{" "}
    {children}
  </li>
);

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <div id={id} className="mt-8 scroll-mt-6">
    <h3 className="text-2xl font-medium">{title}</h3>
    <div className="text-gray-400 text-sm mt-3 space-y-3">{children}</div>
  </div>
);

const List = ({ children }: { children: ReactNode }) => (
  <ul className="mt-4 space-y-4 text-gray-400 text-sm list-none">{children}</ul>
);

const link = "text-blue-400 underline underline-offset-2 hover:text-blue-300";

const Legal = ({ onNext, onPrev }: any) => {
  return (
    <div id="legal" className="max-w-[59rem]">

      <p className="text-gray-500 text-xs">Last updated {LEGAL_UPDATED}</p>

      <h2 id="terms-of-use" className="text-white text-xl font-semibold mt-4 scroll-mt-6">
        Terms of Use
      </h2>

      <p className="text-gray-400 text-sm mt-4">
        By agreeing when prompted, connecting your wallet, or otherwise using Nexura, you agree to these Terms of Use and to our{" "}
        <a href={PRIVACY_URL} className={link}>Privacy Policy</a>.
      </p>

      <List>
        <Item label="Eligibility">
          You must be at least {MIN_AGE} years old and of legal age in your jurisdiction to use Nexura. By connecting your wallet, you confirm that you meet this requirement and that you are legally permitted to interact with blockchain-based platforms in your region.
        </Item>

        <Item label="Wallet Responsibility">
          Your wallet is your identity on Nexura. You are solely responsible for the security of your wallet credentials, including your private key and seed phrase. Nexura does not store, have access to, or have any ability to recover your wallet credentials.
        </Item>

        <Item label="Participation">
          Participation on Nexura must be genuine. Attempting to manipulate the system through multiple wallets, automated interactions, fabricated proof of action, or any other method designed to inflate participation metrics or rewards is a violation of these terms and may result in your wallet being banned from programs across the platform.
        </Item>

        <Item label="Quest and Campaign Completion">
          Completing a quest or campaign and submitting proof of action is a declaration that the described activity was genuinely performed by the wallet submitting the claim. False or misleading submissions are a violation of these terms.
        </Item>

        <Item label="Ecosystem Dapps">
          Dapps listed on Nexura are shown for discovery and visibility only. A listing does not mean we endorse, control, audit, or take responsibility for these projects. We do not have control over how these dapps function, how they manage user data or funds, or any issues you may encounter while using them. Do your own research and exercise caution when interacting with any third-party dapp.
        </Item>
      </List>

      <Section id="changes-to-terms" title="Changes to Terms">
        <p>
          Nexura may update these terms and the Privacy Policy. When we do, we change the date at the top of this page and ask you to review and agree to the new version before you continue using Nexura. If you do not agree, do not connect your wallet or use the platform.
        </p>
      </Section>

      <h2 id="privacy-policy" className="text-white text-xl font-semibold mt-12 scroll-mt-6">
        Privacy Policy
      </h2>

      <p className="text-gray-400 text-sm mt-4">
        This Privacy Policy explains what information Nexura collects when you use the Nexura app and Nexura Studio, how we use it, and the choices you have.
      </p>

      <Section id="information-we-collect" title="Information We Collect">
        <List>
          <Item label="Wallet">
            Your public wallet address and the message you sign to prove you control it. We never ask for, receive, or store your private key or seed phrase.
          </Item>
          <Item label="Profile">
            Your username, display name and profile picture.
          </Item>
          <Item label="Connected Accounts">
            Your X and Discord username and account ID, when you choose to connect them.
          </Item>
          <Item label="Activity">
            Quests, campaigns and lessons you complete, check-ins, XP, levels, badges, rewards, referrals, and the proof of action you submit.
          </Item>
          <Item label="Approximate Location">
            When you sign in, your IP address is used to determine your country and continent. We keep the country and continent with your account. The IP address itself is only kept briefly in security records used to stop abuse.
          </Item>
          <Item label="Studio Accounts">
            For project teams using Nexura Studio: email address, password (stored only in hashed form), two-factor authentication settings, project details, and team roles.
          </Item>
          <Item label="Browser Storage">
            Sign-in tokens and preferences are stored in your browser to keep you signed in. We do not use advertising cookies or third-party analytics trackers.
          </Item>
        </List>
      </Section>

      <Section id="how-we-use-information" title="How We Use Information">
        <List>
          <Item label="Operating Nexura">Signing you in, tracking your progress, and distributing rewards.</Item>
          <Item label="Verification">Confirming that quests and campaigns were completed.</Item>
          <Item label="Leaderboards and Profiles">Showing rankings, levels and achievements.</Item>
          <Item label="Safety">Detecting and preventing fraud, abuse and manipulation, including the use of multiple wallets.</Item>
          <Item label="Account Emails">Sending Studio users verification codes and security notices.</Item>
          <Item label="Statistics">Producing aggregate figures, such as the number of users by country.</Item>
          <Item label="Legal">Meeting our legal obligations.</Item>
        </List>
      </Section>

      <Section id="public-information" title="Public Information">
        <List>
          <Item label="Blockchain">
            Blockchain transactions are public and permanent. Nexura cannot change or delete information recorded on a blockchain.
          </Item>
          <Item label="Leaderboards">
            Your username, profile picture, level, XP and badges may appear on leaderboards and profiles that others can see.
          </Item>
          <Item label="Projects">
            Projects whose quests or campaigns you take part in can see your submissions and participation in those programs.
          </Item>
        </List>
      </Section>

      <Section id="how-we-share-information" title="How We Share Information">
        <p>We do not sell your personal information. We share it only as follows:</p>
        <List>
          <Item label="Service Providers">
            Companies that help us run Nexura: cloud hosting and database providers, image and file storage providers, email delivery providers, an IP geolocation service, blockchain infrastructure providers (network nodes and indexers), wallet connection services, and social data services that verify X tasks.
          </Item>
          <Item label="Platforms You Connect">
            When you connect X or Discord, those platforms receive information under their own privacy policies.
          </Item>
          <Item label="Legal Requirements">
            When required by law, or to protect the rights, property or safety of Nexura, our users or others.
          </Item>
          <Item label="Business Transfers">
            If Nexura is involved in a merger, acquisition or sale of assets, information may be transferred as part of that transaction.
          </Item>
        </List>
      </Section>

      <Section id="data-retention" title="Data Retention">
        <p>
          We keep your information while your account is active and as needed to run Nexura. Wallet addresses of banned accounts are kept to enforce bans. Security records used to stop abuse expire automatically. When you ask us to delete your account, we delete or anonymize your information unless we need to keep it for legal, security or fraud-prevention reasons.
        </p>
      </Section>

      <Section id="your-choices" title="Your Choices and Rights">
        <p>
          You can edit your profile and disconnect X or Discord at any time from your profile. You can ask us for a copy of your information, or ask us to correct or delete it, by contacting us. Depending on where you live, you may have additional rights under local law, such as the right to object to or restrict certain processing. We will respond within the time required by applicable law.
        </p>
      </Section>

      <Section id="security" title="Security">
        <p>
          We use measures such as signed wallet sign-in, hashed passwords, optional two-factor authentication for Studio and encrypted connections. No system is completely secure, and you are responsible for keeping your wallet and its credentials safe.
        </p>
      </Section>

      <Section id="children" title="Children">
        <p>
          Nexura is not intended for anyone under {MIN_AGE}. We do not knowingly collect information from children. If we learn that we have collected information from someone under {MIN_AGE}, we will delete it and close the account. If you believe a child has used Nexura, please contact us.
        </p>
      </Section>

      <Section id="international-transfers" title="International Transfers">
        <p>
          Nexura and its service providers may process your information in countries other than the one you live in, where data protection laws may differ.
        </p>
      </Section>

      <Section id="policy-changes" title="Changes to This Policy">
        <p>
          When we update this policy, we change the date at the top of this page and ask you to review and agree to the new version before you continue using Nexura.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p>
          Questions and privacy requests can be sent to the Nexura team on{" "}
          <a href="https://discord.gg/bADTCtzyb" target="_blank" rel="noopener noreferrer" className={link}>Discord</a> or{" "}
          <a href="https://x.com/NexuraXYZ" target="_blank" rel="noopener noreferrer" className={link}>X</a>.
        </p>
      </Section>

      <div className="mt-10 flex justify-between max-w-[59rem]">

        <div
          onClick={onPrev}
          className="w-[10rem] cursor-pointer group border border-white/30 rounded-lg p-2"
        >
          <div className="flex justify-start">
            <h4 className="text-[#8B3EFE] text-xs font-medium tracking-wider">
              PREVIOUS
            </h4>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[#8B3EFE] transition group-hover:-translate-x-1">
              ←
            </span>

            <p className="text-gray-400 text-sm">
              FAQs
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Legal;
