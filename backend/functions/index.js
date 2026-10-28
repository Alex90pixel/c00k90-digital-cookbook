const functions = require("firebase-functions");
const functionsV1 = require("firebase-functions/v1");
const {defineSecret} = require("firebase-functions/params");
const cors = require("cors")({origin: true});
const fs = require("fs");
const path = require("path");

// Cheia API Brevo, din Google Cloud Secret Manager.
const brevoApiKey = defineSecret("BREVO_API_KEY");

// Expeditorul trebuie să fie verificat în Brevo (Senders).
const WELCOME_SENDER = {name: "C00K90", email: "adrian@antdevlabs.com"};
const WELCOME_SUBJECT = "Welcome to C00K90! 🍳";
const readEmail = (file) =>
  fs.readFileSync(path.join(__dirname, "emails", file), "utf8");
const welcomeHtml = readEmail("welcome.html");
const welcomeText = readEmail("welcome.txt");

// Funcția asta primește un URL (YouTube sau TikTok) și întoarce
// titlul, autorul și un thumbnail — fără să copieze conținutul video.
exports.getRecipeMetadata = functions.https.onRequest(
    {maxInstances: 3},
    (req, res) => {
      cors(req, res, async () => {
        const url = req.query.url || (req.body && req.body.url);

        if (!url) {
          return res.status(400).json({error: "Lipsește parametrul 'url'"});
        }

        let oembedUrl;

        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        } else if (url.includes("tiktok.com")) {
          oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        } else {
          return res.status(400).json({
            error: "Platformă neacceptată (doar YouTube/TikTok momentan)",
          });
        }

        try {
          const response = await fetch(oembedUrl);

          if (!response.ok) {
            throw new Error(`oEmbed a răspuns cu status ${response.status}`);
          }

          const data = await response.json();

          return res.status(200).json({
            title: data.title || "",
            author: data.author_name || "",
            thumbnail: data.thumbnail_url || "",
            sourceUrl: url,
          });
        } catch (err) {
          console.error("Eroare la preluarea metadatelor:", err);
          return res.status(500).json({
            error: "Nu am putut prelua informațiile de la acest link",
          });
        }
      });
    });

// Trimite un email de bun venit (prin Brevo) când se creează un cont nou.
// Conturile se creează la prima autentificare cu Google.
exports.sendWelcomeEmail = functionsV1
    .runWith({secrets: [brevoApiKey], maxInstances: 3})
    .auth.user()
    .onCreate(async (user) => {
      if (!user.email) return;

      // "{{name}}" devine " Prenume" (cu spațiu), ca "Salut{{name}}!" să
      // arate bine și fără nume.
      const firstName = (user.displayName || "").trim().split(/\s+/)[0];
      const fill = (template, name) =>
        template.replaceAll("{{name}}", name ? ` ${name}` : "");

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey.value(),
          "content-type": "application/json",
          "accept": "application/json",
        },
        body: JSON.stringify({
          sender: WELCOME_SENDER,
          to: [{email: user.email, name: user.displayName || undefined}],
          subject: WELCOME_SUBJECT,
          htmlContent: fill(welcomeHtml, escapeHtml(firstName)),
          textContent: fill(welcomeText, firstName),
          tags: ["welcome"],
        }),
      });

      if (!response.ok) {
        console.error(
            "Brevo nu a trimis emailul de bun venit:",
            response.status,
            await response.text(),
        );
      }
    });

/**
 * Escapează un text ca să poată fi pus în HTML.
 * @param {string} text
 * @return {string}
 */
function escapeHtml(text) {
  return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
}
