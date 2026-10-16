import { ChefProfile } from './chef.model';
import { chefAvatarUrl } from './chef-display';

const chef = (photoUrl: string): ChefProfile => ({
  id: 'c1',
  displayName: 'Ana',
  photoUrl,
  facebook: '',
  instagram: '',
  tiktok: '',
  youtube: '',
});

describe('chefAvatarUrl', () => {
  it('shows photos from Google accounts and our Firebase Storage', () => {
    const google = 'https://lh3.googleusercontent.com/a/photo';
    const storage = 'https://firebasestorage.googleapis.com/v0/b/x/o/profiles%2Fc1%2Favatar.jpg';
    expect(chefAvatarUrl(chef(google), 'x')).toBe(google);
    expect(chefAvatarUrl(chef(storage), 'x')).toBe(storage);
  });

  it('replaces any other photo URL with a letter avatar', () => {
    for (const url of [
      'https://tracker.example.com/pixel.png',
      'http://lh3.googleusercontent.com/a/photo',
      'https://googleusercontent.com.evil.com/a.png',
      'javascript:alert(1)',
    ]) {
      expect(chefAvatarUrl(chef(url), 'x')).toMatch(/^data:image\/svg\+xml/);
    }
  });

  it('uses the fallback name for chefs without a profile', () => {
    expect(decodeURIComponent(chefAvatarUrl(null, 'Unknown'))).toContain('>U</text>');
  });
});
