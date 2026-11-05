import { voiceCommand } from './voice-commands';

describe('voiceCommand', () => {
  it('understands the commands in every language', () => {
    expect(voiceCommand('Next')).toBe('next');
    expect(voiceCommand('Următorul!')).toBe('next');
    expect(voiceCommand('înapoi')).toBe('back');
    expect(voiceCommand('Siguiente')).toBe('next');
    expect(voiceCommand('retour')).toBe('back');
    expect(voiceCommand('avanti')).toBe('next');
    expect(voiceCommand('Zurück')).toBe('back');
    expect(voiceCommand('repetă')).toBe('read');
    expect(voiceCommand('ingrediente')).toBe('ingredients');
    expect(voiceCommand('start timer')).toBe('timer');
  });

  it('lets the last word decide', () => {
    expect(voiceCommand('ok next')).toBe('next');
    expect(voiceCommand('no wait back')).toBe('back');
  });

  it('ignores kitchen talk', () => {
    expect(voiceCommand('can you pass me the salt')).toBeNull();
    expect(voiceCommand('I will be back in five minutes, ok?')).toBeNull();
    expect(voiceCommand('')).toBeNull();
  });
});
