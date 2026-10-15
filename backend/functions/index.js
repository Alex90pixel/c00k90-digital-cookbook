const functions = require("firebase-functions");
const cors = require("cors")({origin: true});

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
