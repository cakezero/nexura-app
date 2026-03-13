import nodemailer from "nodemailer";
import hbs, {
  type NodemailerExpressHandlebarsOptions,
} from "nodemailer-express-handlebars";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import logger from "@/config/logger";
import { EMAIL_USER, EMAIL_PASSWORD, ADMIN_URL, CLIENT_URL } from "./env.utils";

const __dirname = dirname(fileURLToPath(import.meta.url));

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

const options: NodemailerExpressHandlebarsOptions = {
  viewEngine: {
    partialsDir: path.resolve(__dirname, "../utils/templates"),
    defaultLayout: false,
  },
  viewPath: path.resolve(__dirname, "../utils/templates"),
};

transporter.use("compile", hbs(options));

export const sendEmailToAdmin = async (email: string, code: string) => {
  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: "Complete Nexura Admin Setup",
      template: "admin",
      context: {
        url: `${ADMIN_URL}/admin/signup`,
        code
      },
    } as MailOptions);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const resetEmail = async (email: string, link: string) => {
  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: "Reset Password",
      template: "reset",
      context: {
        link
      },
    } as MailOptions);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const addHubAdminEmail = async (email: string, code: string, origin?: string) => {
  try {
    const baseUrl = origin || CLIENT_URL;
    const signUpUrl = `${baseUrl}/studio/register?email=${encodeURIComponent(email)}`;
    logger.info(`Sending admin invite to ${email} with link ${signUpUrl}`);
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: "Hub admin setup",
      template: "admin-setup",
      context: {
        url: signUpUrl,
        code
      },
    } as MailOptions);
    logger.info(`Admin invite email sent successfully to ${email}`);
  } catch (error: any) {
    logger.error(`Failed to send admin invite email to ${email}:`, error.message);
    throw new Error(error.message);
  }
};