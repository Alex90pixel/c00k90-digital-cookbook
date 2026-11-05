import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { CookModeDialog } from './cook-mode-dialog';

async function setup() {
  const close = vi.fn();
  TestBed.configureTestingModule({
    imports: [CookModeDialog],
    providers: [
      {
        provide: DIALOG_DATA,
        useValue: {
          recipeName: 'Pancakes',
          steps: ['Mix', 'Rest', 'Fry'],
          ingredients: [{ qty: '200', unit: 'g', name: 'flour' }],
        },
      },
      { provide: DialogRef, useValue: { close } },
    ],
  });
  const fixture = TestBed.createComponent(CookModeDialog);
  fixture.detectChanges();
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const step = () => element.querySelector('.cook-step')?.textContent?.trim();
  const press = (key: string) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    fixture.detectChanges();
  };
  return { element, step, press, fixture, close };
}

describe('CookModeDialog', () => {
  it('shows one step at a time and moves with the arrow keys', async () => {
    const { step, press } = await setup();
    expect(step()).toBe('Mix');
    press('ArrowRight');
    expect(step()).toBe('Rest');
    press('ArrowRight');
    press('ArrowRight');
    expect(step()).toBe('Fry');
    press('ArrowLeft');
    expect(step()).toBe('Rest');
  });

  it('celebrates on the last step and then closes as cooked', async () => {
    vi.useFakeTimers();
    try {
      const { element, press, fixture, close } = await setup();
      press('ArrowRight');
      press('ArrowRight');
      element.querySelector<HTMLButtonElement>('.cook-bar .btn-save')!.click();
      fixture.detectChanges();
      expect(element.querySelector('.party-text')).not.toBeNull();
      expect(close).not.toHaveBeenCalled();
      vi.advanceTimersByTime(2000);
      expect(close).toHaveBeenCalledWith('cooked');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows the ingredients on request', async () => {
    const { element, fixture } = await setup();
    const toggle = element.querySelector<HTMLButtonElement>('.cook-bar .btn-action')!;
    toggle.click();
    fixture.detectChanges();
    expect(element.querySelector('.cook-ingredients')?.textContent).toContain('200 g flour');
  });

  it('offers a timer for a time in the step and counts it down', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CookModeDialog],
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: { recipeName: 'Rice', steps: ['Simmer for 10 minutes'], ingredients: [] },
        },
        { provide: DialogRef, useValue: { close: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(CookModeDialog);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const start = element.querySelector<HTMLButtonElement>('.timer-start');
    expect(start?.textContent).toContain('10 min');
    start!.click();
    fixture.detectChanges();
    expect(element.querySelector('.timer-clock')?.textContent).toContain('10:00');
  });
});
