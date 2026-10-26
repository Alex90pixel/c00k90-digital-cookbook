import { ImageRegion } from '../../core/images/models/image-region.model';

/** What the AI read from a photo of a handwritten recipe. */
export interface TranscribedRecipe {
  name: string;
  /** One ingredient per line, e.g. "200 g faina". */
  ingredients: string[];
  /** One step per line. */
  steps: string[];
  /** Where the photo of the finished dish is on the page, if there is one. */
  dishPhoto?: ImageRegion;
}

/** The raw JSON answer; `dishPhotoBox` is [ymin, xmin, ymax, xmax] on a 0–1000 scale. */
export interface TranscriptionAnswer {
  name?: string;
  ingredients?: string[];
  steps?: string[];
  dishPhotoBox?: number[];
}
