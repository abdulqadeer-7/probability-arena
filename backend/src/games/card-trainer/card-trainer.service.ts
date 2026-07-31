import { Injectable } from '@nestjs/common';

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
  rank: number;
  color: 'red' | 'black';
}

export interface DeckState {
  deck: Card[];
  remaining: Card[];
  drawn: Card[];
}

export type CardFilter = 'suit' | 'value' | 'color';

@Injectable()
export class CardTrainerService {
  private readonly SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  private readonly VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  createDeck(decks: number = 1): Card[] {
    const cards: Card[] = [];
    for (let d = 0; d < decks; d++) {
      for (const suit of this.SUITS) {
        for (let i = 0; i < this.VALUES.length; i++) {
          cards.push({
            suit,
            value: this.VALUES[i],
            rank: i + 1,
            color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
          });
        }
      }
    }
    return cards;
  }

  shuffle(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  drawCard(deck: Card[]): Card {
    if (deck.length === 0) {
      throw new Error('No cards remaining in deck');
    }
    return deck[0];
  }

  calculateProbability(
    remaining: Card[],
    filterBy: CardFilter,
    value: string,
  ): number {
    if (remaining.length === 0) return 0;

    const matching = remaining.filter((card) => {
      switch (filterBy) {
        case 'suit':
          return card.suit === value;
        case 'value':
          return card.value === value;
        case 'color':
          return card.color === value;
        default:
          return false;
      }
    });

    return parseFloat(((matching.length / remaining.length) * 100).toFixed(2));
  }

  generateResult(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    deck: Card[] = this.createDeck(1),
  ): { drawn: Card[]; remaining: Card[] } {
    const shuffled = this.shuffle(deck);
    const drawn = [shuffled[0], shuffled[1]];
    const remaining = shuffled.slice(2);
    return { drawn, remaining };
  }
}
