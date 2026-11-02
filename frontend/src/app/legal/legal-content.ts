import { Language } from '../core/i18n/i18n.service';

/** A piece of a paragraph: plain text, bold text, or the contact e-mail as a link. */
export type LegalPart = string | { strong: string } | { email: string };

export interface LegalParagraph {
  /** Bold lead-in, e.g. "What we collect:". */
  label?: string;
  parts: LegalPart[];
}

export interface LegalSection {
  title: string;
  updated?: string;
  paragraphs: LegalParagraph[];
}

const CONTACT_EMAIL = 'c00k90.contact@gmail.com';

/**
 * Privacy policy, terms and nutrition disclaimer. Long legal text lives here rather than in the
 * translation dictionaries, so each language reads as one document.
 */
export const LEGAL_CONTENT: Record<Language, LegalSection[]> = {
  en: [
    {
      title: 'Privacy Policy',
      updated: 'Last updated: November 2, 2026',
      paragraphs: [
        {
          label: 'What we collect:',
          parts: [
            'when you sign in with Google, we receive your display name, email address and profile picture (if any). We also store what you enter directly in the app: recipes, ingredients, notes, photos you upload, categories, and tags. If you fill in your profile, we also store the names, profile photo and social media links you enter there; all of them are optional. We also store the list of chefs you follow, the recipes you save as favorites, your recipe collections, your meal plan and, if you set them, your allergies (used only to warn you about recipes), which only you can see.',
          ],
        },
        {
          label: "What we don't collect:",
          parts: [
            'we never access your contacts, photo gallery, location or anything beyond what you enter in the app yourself.',
          ],
        },
        {
          label: 'How we use your data:',
          parts: [
            "to display and sync your recipes across your devices. We never sell or rent your data, and we don't use it for advertising.",
          ],
        },
        {
          label: "Where it's stored:",
          parts: [
            'on Firebase (Google Cloud), which acts as our data processor under its own security measures.',
          ],
        },
        {
          label: 'Reading recipes from photos (AI):',
          parts: [
            'when you use "From a notebook photo", the photo you pick is sent to Google\'s Gemini AI (through Firebase AI Logic, in a separate Google Cloud project) only to read the recipe from it. We don\'t store that photo; only the cropped dish photo is kept, and only if you save it with the recipe. Google processes the photo under its Gemini API terms; on the free tier we use, Google may use it to improve its services, so please don\'t photograph pages with personal information. The same goes for the ingredients you type in "What can I cook?": only that text is sent to Gemini, to suggest recipes. When you press "Detect from ingredients", only the recipe\'s ingredient list is sent, to suggest its allergens. This feature is protected by Google reCAPTCHA Enterprise, which checks that requests come from the real app and may collect information about your device and browser under Google\'s privacy policy.',
          ],
        },
        {
          label: 'Welcome email:',
          parts: [
            "when you create an account, your email address and first name are sent to Brevo (Sendinblue SAS, France), our email provider, only to send you one welcome email. We don't send newsletters.",
          ],
        },
        {
          label: 'Cookies & local storage:',
          parts: [
            "we don't use advertising or analytics cookies, and we don't track you across websites. The app only uses the browser storage that's strictly necessary to keep you signed in (set by Firebase Authentication) and to remember your preferences (theme, language, cookie choice). Fonts are loaded from Google Fonts, which means your browser connects to Google's servers when the page loads. Recipe videos are played from YouTube in its privacy-enhanced mode (youtube-nocookie.com), and only after you press play; from then on, YouTube's own privacy policy applies to the video. If we ever add optional analytics or ads, they will only run with your consent, which you can give or change anytime via \"Cookie settings\" at the bottom of the page.",
          ],
        },
        {
          label: 'Hosting:',
          parts: [
            "the app is hosted at cookbook.antdevlabs.com by our web hosting provider (Hosterion, Romania), whose servers may log visitors' IP addresses for security purposes. The old address on GitHub Pages only redirects here; GitHub may log visitors' IP addresses under its own privacy policy.",
          ],
        },
        {
          label: 'Who we are & contact:',
          parts: [
            'C00K90 is a personal, non-commercial project run by its developer. For any privacy question or request, write to ',
            { email: CONTACT_EMAIL },
            '.',
          ],
        },
        {
          label: 'Imported recipes:',
          parts: [
            "if you import a recipe from a link (YouTube, TikTok, etc.), we only save the link, title, category, and your own note — never the creator's full content. The source stays visible and credited.",
          ],
        },
        {
          label: 'Shared recipes:',
          parts: [
            'if you choose "Share to Get Inspired" on a recipe, that recipe becomes visible to all signed-in users of the app, together with your public chef profile: your displayed name, profile picture and social media links. Your first and last name are never shown. Other users can follow you to see your shared recipes. You can stop sharing anytime: the recipe will no longer be visible to others, and when you no longer share any recipe, your public chef profile is removed too.',
          ],
        },
        {
          label: 'Your rights:',
          parts: [
            'you can download a copy of all your data using "Export my data", or permanently delete your account and all your data using "Delete my account" — both available in Settings, in the menu under your profile picture.',
          ],
        },
        {
          label: 'Minimum age:',
          parts: ['this app is intended for users 18 and older.'],
        },
      ],
    },
    {
      title: 'Terms of Use',
      paragraphs: [
        {
          parts: [
            'C00K90 — Digital Cook Book is a personal project, offered free of charge, with no guarantee of continuous availability, accuracy, or error-free operation. It may be changed, interrupted, or discontinued at any time.',
          ],
        },
        {
          parts: [
            "You're solely responsible for the recipes, notes, and photos you upload. Only share photos you took yourself or have the right to use, and don't post content that infringes on someone else's copyright. Don't post offensive, explicit, violent or hateful content. We may hide or remove content that breaks these rules, and suspend accounts that repeatedly do so.",
          ],
        },
        {
          label: 'Removal requests:',
          parts: [
            'if you believe a recipe or photo shared in C00K90 uses your content without permission, write to ',
            { email: CONTACT_EMAIL },
            ' with a link to it or the recipe name, and we will review it and remove it if needed. You can also use "Report" on any shared recipe.',
          ],
        },
        {
          parts: [
            "To the fullest extent permitted by law, the developer isn't responsible for errors in recipes or nutrition values, allergic reactions or health issues from preparing or consuming a recipe, or account security issues arising from a compromised Google account.",
          ],
        },
      ],
    },
    {
      title: 'Nutrition Disclaimer',
      paragraphs: [
        {
          parts: [
            'Nutrition values (calories, protein, etc.) are ',
            { strong: 'automatic estimates' },
            ' and may contain errors. They are not medical or professional nutritional advice. If you have allergies or medical conditions, always double-check the original ingredients.',
          ],
        },
      ],
    },
  ],

  ro: [
    {
      title: 'Politica de confidențialitate',
      updated: 'Ultima actualizare: 2 noiembrie 2026',
      paragraphs: [
        {
          label: 'Ce date colectăm:',
          parts: [
            'când te autentifici cu Google, primim numele afișat, adresa de e-mail și fotografia de profil (dacă există). Stocăm și ce introduci direct în aplicație: rețete, ingrediente, notițe, fotografiile pe care le încarci, categorii și etichete. Dacă îți completezi profilul, stocăm și numele, fotografia de profil și linkurile către rețelele sociale introduse acolo; toate sunt opționale. Stocăm și lista bucătarilor pe care îi urmărești, rețetele salvate la favorite, colecțiile tale de rețete, planul de mese și, dacă le setezi, alergiile tale (folosite doar ca să te avertizăm la rețete), vizibile doar pentru tine.',
          ],
        },
        {
          label: 'Ce date nu colectăm:',
          parts: [
            'nu îți accesăm niciodată contactele, galeria foto, locația sau orice altceva în afară de ce introduci tu în aplicație.',
          ],
        },
        {
          label: 'Cum folosim datele tale:',
          parts: [
            'ca să îți afișăm și să îți sincronizăm rețetele pe toate dispozitivele. Nu vindem și nu închiriem niciodată datele tale și nu le folosim pentru reclame.',
          ],
        },
        {
          label: 'Unde sunt stocate:',
          parts: [
            'pe Firebase (Google Cloud), care acționează ca persoană împuternicită de noi, cu propriile măsuri de securitate.',
          ],
        },
        {
          label: 'Citirea rețetelor din poze (AI):',
          parts: [
            'când folosești „Din poza unui caiet”, poza aleasă este trimisă către inteligența artificială Gemini de la Google (prin Firebase AI Logic, într-un proiect Google Cloud separat) doar ca să citească rețeta din ea. Nu păstrăm acea poză; se păstrează doar poza decupată a mâncării și doar dacă o salvezi împreună cu rețeta. Google procesează poza conform termenilor Gemini API; pe varianta gratuită pe care o folosim, Google o poate folosi ca să-și îmbunătățească serviciile, așa că te rugăm să nu fotografiezi pagini cu informații personale. La fel și pentru ingredientele pe care le scrii la „Ce pot găti?”: doar acel text este trimis către Gemini, ca să-ți propună rețete. Când apeși „Detectează din ingrediente”, se trimite doar lista de ingrediente a rețetei, ca să fie sugerați alergenii. Funcția este protejată de Google reCAPTCHA Enterprise, care verifică faptul că cererile vin din aplicația reală și poate colecta informații despre dispozitivul și browserul tău, conform politicii de confidențialitate Google.',
          ],
        },
        {
          label: 'E-mailul de bun venit:',
          parts: [
            'când îți creezi un cont, adresa de e-mail și prenumele tău sunt trimise către Brevo (Sendinblue SAS, Franța), furnizorul nostru de e-mail, doar ca să-ți trimitem un singur e-mail de bun venit. Nu trimitem newslettere.',
          ],
        },
        {
          label: 'Cookie-uri și stocare locală:',
          parts: [
            'nu folosim cookie-uri de publicitate sau de analiză și nu te urmărim pe alte site-uri. Aplicația folosește doar stocarea din browser strict necesară ca să rămâi autentificat (setată de Firebase Authentication) și ca să-ți rețină preferințele (tema, limba, alegerea privind cookie-urile). Fonturile sunt încărcate de la Google Fonts, ceea ce înseamnă că browserul tău se conectează la serverele Google când se încarcă pagina. Videoclipurile rețetelor rulează de pe YouTube, în modul cu confidențialitate sporită (youtube-nocookie.com), și doar după ce apeși pe redare; din acel moment, pentru videoclip se aplică politica de confidențialitate a YouTube. Dacă vom adăuga vreodată analize sau reclame opționale, acestea vor funcționa doar cu acordul tău, pe care îl poți da sau schimba oricând din „Setări cookie”, în partea de jos a paginii.',
          ],
        },
        {
          label: 'Găzduire:',
          parts: [
            'aplicația este găzduită la cookbook.antdevlabs.com de furnizorul nostru de găzduire web (Hosterion, România), ale cărui servere pot înregistra adresele IP ale vizitatorilor din motive de securitate. Vechea adresă de pe GitHub Pages doar redirecționează aici; GitHub poate înregistra adresele IP ale vizitatorilor conform propriei politici de confidențialitate.',
          ],
        },
        {
          label: 'Cine suntem și contact:',
          parts: [
            'C00K90 este un proiect personal, necomercial, administrat de dezvoltatorul său. Pentru orice întrebare sau solicitare privind confidențialitatea, scrie-ne la ',
            { email: CONTACT_EMAIL },
            '.',
          ],
        },
        {
          label: 'Rețete importate:',
          parts: [
            'dacă imporți o rețetă dintr-un link (YouTube, TikTok etc.), salvăm doar linkul, titlul, categoria și notița ta — niciodată conținutul complet al creatorului. Sursa rămâne vizibilă și creditată.',
          ],
        },
        {
          label: 'Rețete distribuite:',
          parts: [
            'dacă alegi „Distribuie în Inspirație” pentru o rețetă, aceasta devine vizibilă pentru toți utilizatorii autentificați ai aplicației, împreună cu profilul tău public de bucătar: numele afișat, fotografia de profil și linkurile către rețelele sociale. Prenumele și numele tău nu sunt afișate niciodată. Ceilalți utilizatori te pot urmări ca să-ți vadă rețetele distribuite. Poți opri distribuirea oricând: rețeta nu va mai fi vizibilă pentru ceilalți, iar când nu mai distribui nicio rețetă, profilul tău public de bucătar este șters și el.',
          ],
        },
        {
          label: 'Drepturile tale:',
          parts: [
            'poți descărca o copie a tuturor datelor tale cu „Exportă datele mele” sau îți poți șterge definitiv contul și toate datele cu „Șterge-mi contul” — ambele disponibile în Setări, în meniul de sub fotografia ta de profil.',
          ],
        },
        {
          label: 'Vârsta minimă:',
          parts: ['aplicația este destinată utilizatorilor cu vârsta de cel puțin 18 ani.'],
        },
      ],
    },
    {
      title: 'Termeni de utilizare',
      paragraphs: [
        {
          parts: [
            'C00K90 — Carte de bucate digitală este un proiect personal, oferit gratuit, fără garanția disponibilității continue, a exactității sau a funcționării fără erori. Poate fi modificat, întrerupt sau oprit oricând.',
          ],
        },
        {
          parts: [
            'Ești singurul responsabil pentru rețetele, notițele și fotografiile pe care le încarci. Distribuie doar fotografii făcute de tine sau pe care ai dreptul să le folosești și nu publica conținut care încalcă drepturile de autor ale altcuiva. Nu publica conținut ofensator, explicit, violent sau care incită la ură. Putem ascunde sau șterge conținutul care încalcă aceste reguli și putem suspenda conturile care le încalcă în mod repetat.',
          ],
        },
        {
          label: 'Cereri de eliminare:',
          parts: [
            'dacă o rețetă sau o fotografie distribuită în C00K90 îți folosește conținutul fără permisiune, scrie-ne la ',
            { email: CONTACT_EMAIL },
            ' cu linkul sau numele rețetei, iar noi o vom verifica și o vom elimina dacă este cazul. Poți folosi și „Raportează” la orice rețetă distribuită.',
          ],
        },
        {
          parts: [
            'În măsura maximă permisă de lege, dezvoltatorul nu răspunde pentru erorile din rețete sau din valorile nutriționale, pentru reacțiile alergice sau problemele de sănătate apărute în urma preparării sau consumului unei rețete și nici pentru problemele de securitate ale contului cauzate de un cont Google compromis.',
          ],
        },
      ],
    },
    {
      title: 'Avertisment privind valorile nutriționale',
      paragraphs: [
        {
          parts: [
            'Valorile nutriționale (calorii, proteine etc.) sunt ',
            { strong: 'estimări automate' },
            ' și pot conține erori. Ele nu reprezintă un sfat medical sau nutrițional de specialitate. Dacă ai alergii sau afecțiuni medicale, verifică întotdeauna ingredientele originale.',
          ],
        },
      ],
    },
  ],
};
