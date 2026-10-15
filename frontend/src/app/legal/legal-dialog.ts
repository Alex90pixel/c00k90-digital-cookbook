import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-legal-dialog',
  template: `
    <div class="form-modal" aria-labelledby="legal-title">
      <div class="form-header">
        <h2 class="form-title" id="legal-title">Privacy &amp; Terms</h2>
        <button type="button" class="detail-close" aria-label="Close" (click)="ref.close()">
          ✕
        </button>
      </div>
      <div class="form-body legal">
        <h3>Privacy Policy</h3>
        <p class="updated">Last updated: October 15, 2026</p>
        <p>
          <strong>What we collect:</strong> if you sign in with Google, we receive your display
          name, email address and profile picture (if any). If you create an account with a username
          instead, we only store that username and a securely encrypted password (handled by
          Firebase Authentication), with no email or real name. We also store what you enter
          directly in the app: recipes, ingredients, notes, photos you upload, categories, and tags.
        </p>
        <p>
          <strong>What we don't collect:</strong> we never access your contacts, photo gallery,
          location or anything beyond what you enter in the app yourself.
        </p>
        <p>
          <strong>How we use your data:</strong> to display and sync your recipes across your
          devices. We never sell or rent your data, and we don't use it for advertising.
        </p>
        <p>
          <strong>Where it's stored:</strong> on Firebase (Google Cloud), which acts as our data
          processor under its own security measures.
        </p>
        <p>
          <strong>Cookies &amp; local storage:</strong> we don't use advertising or analytics
          cookies, and we don't track you across websites. The app only uses the browser storage
          that's strictly necessary to keep you signed in (set by Firebase Authentication). Fonts
          are loaded from Google Fonts, which means your browser connects to Google's servers when
          the page loads. If we ever add optional analytics or ads, they will only run with your
          consent, which you can give or change anytime via "Cookie settings" at the bottom of the
          page.
        </p>
        <p>
          <strong>Hosting:</strong> the app is hosted on GitHub Pages. GitHub may log visitors' IP
          addresses for security purposes, under its own privacy policy.
        </p>
        <p>
          <strong>Who we are &amp; contact:</strong> C00K90 is a personal, non-commercial project
          run by its developer. For any privacy question or request, write to
          <a href="mailto:c00k90.contact@gmail.com">c00k90.contact&#64;gmail.com</a>.
        </p>
        <p>
          <strong>Imported recipes:</strong> if you import a recipe from a link (YouTube, TikTok,
          etc.), we only save the link, title, category, and your own note — never the creator's
          full content. The source stays visible and credited.
        </p>
        <p>
          <strong>Shared recipes:</strong> if you choose "Share to Get Inspired" on a recipe, that
          recipe becomes visible to all signed-in users of the app. Your name and profile picture
          are not shown with it. You can stop sharing anytime, and the recipe will no longer be
          visible to others.
        </p>
        <p>
          <strong>Your rights:</strong> you can download a copy of all your data using "Export my
          data", or permanently delete your account and all your data using "Delete account" — both
          available from the menu under your profile picture.
        </p>
        <p><strong>Minimum age:</strong> this app is intended for users 18 and older.</p>

        <h3>Terms of Use</h3>
        <p>
          C00K90 — Digital Cook Book is a personal project, offered free of charge, with no
          guarantee of continuous availability, accuracy, or error-free operation. It may be
          changed, interrupted, or discontinued at any time.
        </p>
        <p>
          You're solely responsible for the recipes, notes, and photos you upload. Don't post
          content that infringes on someone else's copyright. Don't post offensive, explicit,
          violent or hateful content. We may hide or remove content that breaks these rules, and
          suspend accounts that repeatedly do so.
        </p>
        <p>
          To the fullest extent permitted by law, the developer isn't responsible for errors in
          recipes or nutrition values, allergic reactions or health issues from preparing or
          consuming a recipe, or account security issues arising from a compromised Google account.
        </p>

        <h3>Nutrition Disclaimer</h3>
        <p>
          Nutrition values (calories, protein, etc.) are <strong>automatic estimates</strong> and
          may contain errors. They are not medical or professional nutritional advice. If you have
          allergies or medical conditions, always double-check the original ingredients.
        </p>
      </div>
    </div>
  `,
  styles: `
    .legal {
      color: var(--text-mid);
      font-size: 14px;
      line-height: 1.7;
    }
    h3 {
      margin: 24px 0 10px;
      color: var(--magenta-deep);
      font-size: 1.17em;
    }
    h3:first-child {
      margin-top: 0;
    }
    p {
      margin: 0 0 14px;
    }
    .updated {
      font-size: 12px;
      font-style: italic;
    }
    a {
      color: var(--teal-light);
    }
  `,
})
export class LegalDialog {
  protected readonly ref = inject(DialogRef);
}
