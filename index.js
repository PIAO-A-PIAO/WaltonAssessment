// There's a login issue with SendGrid, so I chose MailGun instead.
// Please note that only verified email addresses can receive emails.

import "dotenv/config";
import fetch from "node-fetch";
import formData from "form-data";
import Mailgun from "mailgun.js";

const fetchMondayBoardData = async () => {
  const query = `query {boards(ids: ${process.env.MONDAY_BOARD_ID}) { items_page { items { name column_values( ids: ["client_email", "email_content"]) { id text }}}}}`;

  try {
    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MONDAY_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();

    const items = result.data.boards[0].items_page.items.map((item) => {
      const email =
        item.column_values.find((col) => col.id === "client_email")?.text || "";
      const emailContent =
        item.column_values.find((col) => col.id === "email_content")?.text ||
        "";
      return {
        name: item.name,
        email,
        emailContent,
      };
    });
    // console.log("items: ", JSON.stringify(items));
    return items;
  } catch (error) {
    console.error("Error: ", error);
    return [];
  }
};

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

const sendEmails = async (items) => {
  try {
    for (const item of items) {
      const emailData = {
        from: `Excited User <mailgun@${process.env.MAILGUN_DOMAIN}>`,
        to: item.email,
        subject: "Email Subject",
        text: item.emailContent,
      };

      await mg.messages
        .create(process.env.MAILGUN_DOMAIN, emailData)
        .catch((err) => console.error("Error:", err));
    }
  } catch (error) {
    console.error("Error: ", error);
  }
};

(async () => {
  const items = await fetchMondayBoardData();
  await sendEmails(items);
})();

// Code in railway.toml

// [build]
// buildCommand = "npm install"

// [deploy]
// command="node index.js"

// [cron]
// schedule = "0 */4 * * 1-5"
// command="node index.js"
