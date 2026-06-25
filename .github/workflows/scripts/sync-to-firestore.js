const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Parse service account from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function syncHtmlToFirestore() {
  // ✏️ Change this to the path of your HTML file in the repo
  const HTML_FILE_PATH = process.env.HTML_FILE_PATH || "index.html";

  // ✏️ Change this to your Firestore collection and document names
  const COLLECTION = "htmlFiles";
  const DOCUMENT_ID = path.basename(HTML_FILE_PATH, ".html"); // e.g. "index"

  if (!fs.existsSync(HTML_FILE_PATH)) {
    console.error(`❌ File not found: ${HTML_FILE_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(HTML_FILE_PATH, "utf8");

  await db.collection(COLLECTION).doc(DOCUMENT_ID).set({
    filename: path.basename(HTML_FILE_PATH),
    content: content,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    commitSha: process.env.GITHUB_SHA || "unknown",
    updatedBy: process.env.GITHUB_ACTOR || "unknown",
  });

  console.log(`✅ Synced "${HTML_FILE_PATH}" → Firestore: ${COLLECTION}/${DOCUMENT_ID}`);
}

syncHtmlToFirestore().catch((err) => {
  console.error("❌ Error syncing to Firestore:", err);
  process.exit(1);
});
