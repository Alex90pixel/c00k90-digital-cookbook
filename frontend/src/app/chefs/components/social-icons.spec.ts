import { TestBed } from '@angular/core/testing';
import { ChefProfile } from '../chef.model';
import { SocialIcons } from './social-icons';

function render(profile: Partial<ChefProfile>): HTMLAnchorElement[] {
  const fixture = TestBed.createComponent(SocialIcons);
  fixture.componentRef.setInput('chef', {
    id: 'c1',
    displayName: 'Ana',
    photoUrl: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    ...profile,
  });
  fixture.componentRef.setInput('name', 'Ana');
  fixture.detectChanges();
  return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a'));
}

describe('SocialIcons', () => {
  it('links only the platforms that are filled in, in a new tab', () => {
    const links = render({
      instagram: 'https://www.instagram.com/ana_cooks',
      youtube: '@AnaCooks',
    });
    expect(links.map((a) => a.href)).toEqual([
      'https://www.instagram.com/ana_cooks',
      'https://www.youtube.com/@AnaCooks',
    ]);
    expect(links.every((a) => a.target === '_blank' && a.rel.includes('noopener'))).toBe(true);
  });

  it('never links tampered or foreign URLs from a chef profile', () => {
    const links = render({
      facebook: 'javascript:alert(1)',
      instagram: 'https://evil.com/ana',
      tiktok: 'https://tiktok.com.evil.com/@ana',
    });
    expect(links).toEqual([]);
  });
});
