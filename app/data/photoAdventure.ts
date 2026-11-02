import type { AdventureLevel } from '../utils/photoAdventure'

export const adventureLevels: AdventureLevel[] = [
  {
    title: 'The Unsent Meadow',
    subtitle: '01 / a place to begin',
    theme: 'meadow',
    rows: [
      '#########',
      '#S..*...#',
      '#.#..#N.#',
      '#.*.....#',
      '#..##...#',
      '#...*..G#',
      '#########',
    ],
    friend: 'Moss, the envelope keeper',
    dialogue: [
      'Oh! You must be Pip. The wind took the colours out of our album. Gather the three memory sparks, then follow the little door. I kept this ribbon for you. In case you needed someone to believe in you.',
      'Three sparks, one little door. And Pip? You don’t have to be brave the whole time. Just the next little step.',
    ],
    objective: 'Collect 3 memory sparks, speak to Moss with E, then find the little door.',
    mothPaths: [],
  },
  {
    title: 'Rain on the Contact Sheet',
    subtitle: '02 / a friend in the rain',
    theme: 'rain',
    rows: [
      '#########',
      '#S...#*G#',
      '#.B.P#..#',
      '#....=..#',
      '#.B.P#..#',
      '#N.*.#*.#',
      '#########',
    ],
    friend: 'Puddle, a cloud with very big feelings',
    dialogue: [
      'I was keeping the bridge dry, but then I remembered a sad song. Sorry about the river. Could you push the two paperweights onto the brass switches? I’ll try to cry somewhere more useful.',
      'Both brass switches need a paperweight. Push them from the side. If one gets stuck, Z takes back your last hop. I wish my weather had an undo button.',
    ],
    objective:
      'Push both paperweights onto switches to unfold the bridge. Find 3 sparks and talk to Puddle.',
    mothPaths: [],
  },
  {
    title: 'The Midnight Darkroom',
    subtitle: '03 / even the dark has friends',
    theme: 'night',
    rows: [
      '#########',
      '#S.*...L#',
      '#..#.#..#',
      '#L......#',
      '#..#.#N.#',
      '#..*L.*G#',
      '#########',
    ],
    friend: 'Dot, the smallest moth',
    dialogue: [
      'Please don’t be scared. My cousins only bump into things because they can’t see. Your camera can make them stop and look. Space for a flash, then four safe hops. Could you light our three lanterns with E?',
      'E lights a lantern when you are next to it. A lantern also recharges your camera. The moths move every second hop. Wait with E, or flash with Space. Nobody here means to be frightening.',
    ],
    objective:
      'Light 3 lanterns with E, gather 3 sparks and meet Dot. Space pauses the wandering moths.',
    mothPaths: [
      [12, 13, 14, 15, 16, 15, 14, 13],
      [28, 29, 30, 31, 32, 33, 34, 33, 32, 31, 30, 29],
    ],
  },
  {
    title: 'Where the Sunset Sleeps',
    subtitle: '04 / a place to come home to',
    theme: 'dawn',
    rows: [
      '#########',
      '#X.....X#',
      '#..#.#..#',
      '#N..V...#',
      '#..#.#..#',
      '#X..S..X#',
      '#########',
    ],
    friend: 'The keeper of almost-forgotten things',
    dialogue: [
      'You brought more than colour back, Pip. You brought the people you met. Wake the memories in the order of your journey: leaf, raindrop, moon, sun. Then stand on the camera mark and press Space. Let’s see what home looks like.',
      'Leaf → raindrop → moon → sun. The symbols are written on the four corners. Use E next to each. Your notebook remembers, even when you don’t.',
    ],
    objective:
      'Wake the corner memories in order: leaf → drop → moon → sun. Talk to the keeper; take a photo on the camera mark with Space.',
    mothPaths: [],
  },
]

export interface StoryFrame {
  speaker: string
  text: string
  scene: 'wind' | 'letter' | 'rain' | 'night' | 'home'
}
export const adventureStories: StoryFrame[][] = [
  [
    {
      speaker: 'Once, between two photographs…',
      text: 'A little creature named Pip lived in the warm corner of an old photo album. Everything Pip loved fit on one page.',
      scene: 'home',
    },
    {
      speaker: 'Then the wind turned a page.',
      text: 'The colours slipped away. The paths between the pictures unravelled. Even the sunset forgot where it belonged.',
      scene: 'wind',
    },
    {
      speaker: 'Pip found a very small letter.',
      text: '“Meet me where the sunset sleeps. Bring the things that made you feel something.” Pip packed a camera. And a snack. Just in case.',
      scene: 'letter',
    },
  ],
  [
    {
      speaker: 'One picture remembered its green.',
      text: 'Moss tied the ribbon around Pip’s camera. “So you’ll remember someone is waiting for you.” Beyond the meadow, a cloud was trying very hard not to cry.',
      scene: 'rain',
    },
    {
      speaker: 'Pip had never photographed the rain.',
      text: 'Perhaps the sky didn’t need fixing. Perhaps it just needed a little company.',
      scene: 'rain',
    },
  ],
  [
    {
      speaker: '“Thank you for not asking me to cheer up.”',
      text: 'Puddle tucked a raindrop into Pip’s pocket. The bridge folded open like a letter. Somewhere on the other side, the dark was full of tiny wings.',
      scene: 'night',
    },
    {
      speaker: 'The camera made a little click.',
      text: 'For one moment, every moth stopped. Not frightened. Just astonished that something so small could make so much light.',
      scene: 'night',
    },
  ],
  [
    {
      speaker: 'Dot gave Pip a moon-shaped button.',
      text: '“For the nights when you feel small.” With the lanterns glowing behind them, Pip climbed into the last photograph.',
      scene: 'home',
    },
    {
      speaker: 'The sunset was there. Waiting.',
      text: 'So was someone Pip almost recognised. “You’ve been collecting the way home all along.”',
      scene: 'home',
    },
  ],
]

export const endingStory: StoryFrame[] = [
  {
    speaker: 'Click.',
    text: 'The album filled with a meadow, a little rain, a room full of wings, and all the kindness Pip had found between them.',
    scene: 'home',
  },
  {
    speaker: '“Is this what home looks like?”',
    text: '“Sometimes,” said the keeper. “Sometimes home is just a collection of things you cared enough to notice.”',
    scene: 'letter',
  },
  {
    speaker: 'Pip left one page empty.',
    text: 'For the next small adventure. And maybe for you.',
    scene: 'home',
  },
]

// The second side of the album: new rules, new little places.
adventureLevels.push(
  {
    title: 'The Breeze Post Office',
    subtitle: '05 / letters with somewhere to go',
    theme: 'meadow',
    quirk: 'wind',
    rows: [
      '#########',
      '#S.>.*..#',
      '#.#..#.N#',
      '#.*.>...#',
      '#.^##...#',
      '#...*..G#',
      '#########',
    ],
    friend: 'Gust, the travelling postmark',
    dialogue: [
      'The wind didn’t steal the colours. It was delivering them! The arrows are its little shortcuts. Step onto one and let it carry you. I have three letters that still need a memory spark.',
      'An arrow carries you one hop in its direction. Follow the breeze, gather three sparks, then try the little door. A wrong turn can be undone with Z.',
    ],
    objective:
      'Ride the paper breezes, gather 3 sparks and meet Gust. Arrow tiles carry Pip along.',
    mothPaths: [],
  },
  {
    title: 'The Frosted Negative',
    subtitle: '06 / a very slippery sort of brave',
    theme: 'rain',
    quirk: 'ice',
    rows: [
      '#########',
      '#S.I.I.*#',
      '#..I.#N.#',
      '#.*III..#',
      '#..#I#..#',
      '#...*..G#',
      '#########',
    ],
    friend: 'Flurry, the mitten keeper',
    dialogue: [
      'I put the whole photograph in the freezer to keep the memories fresh. A small miscalculation. You’ll keep sliding on the shiny tiles until you reach dry paper. A tree makes a perfectly good brake.',
      'Choose your direction before stepping onto ice. You slide until dry ground or an obstacle. The arrow keys still work; Z takes back the whole slide.',
    ],
    objective:
      'Plan your slides across the frozen photograph. Collect 3 sparks, meet Flurry, then find the door.',
    mothPaths: [],
  },
  {
    title: 'The Folded Library',
    subtitle: '07 / two corners of the same page',
    theme: 'night',
    quirk: 'portals',
    rows: [
      '#########',
      '#S.O#..*#',
      '#...#N..#',
      '#.*.#...#',
      '#...#O..#',
      '#...#.*G#',
      '#########',
    ],
    friend: 'Fold, the very quiet librarian',
    dialogue: [
      'Some stories are so close together that their pages touch. The two paper rings are one such fold. Step through either ring and you’ll find the other. Please bring back the three misplaced endings.',
      'The glowing rings connect the two halves of this photograph. Step off a ring before returning through it. The library has no late fees. Only very patient moths.',
    ],
    objective: 'Travel through the paired paper rings, gather 3 sparks and speak to Fold.',
    mothPaths: [],
  },
  {
    title: 'The Tide of Tomorrow',
    subtitle: '08 / the edge of the next adventure',
    theme: 'dawn',
    quirk: 'tide',
    rows: [
      '#########',
      '#S*.~..*#',
      '#...~.N.#',
      '#...T...#',
      '#.*.~...#',
      '#...~.V.#',
      '#########',
    ],
    friend: 'Tomorrow, who is never in a hurry',
    dialogue: [
      'Beyond this tide is a page nobody has seen yet. The water rests for two beats, then rises for two. Your camera can hold a moment still: flash with Space, and cross while the light lasts. Shall we take a photograph of whatever comes next?',
      'E waits a beat. The tide is low on beats three and four. Or use Space: the camera holds the crossing still for four hops. Gather the three sparks, then take the last photograph from the camera mark.',
    ],
    objective:
      'Time the tide or freeze it with your camera. Collect 3 sparks, meet Tomorrow and photograph the camera mark.',
    mothPaths: [],
  },
)

adventureStories.push(
  [
    {
      speaker: 'There was writing on the back.',
      text: 'Pip turned the finished album over. Four more photographs were tucked into its cover. A tiny postmark read: “For the places you haven’t noticed yet.”',
      scene: 'letter',
    },
    {
      speaker: 'The wind had a confession.',
      text: '“I wasn’t taking your colours away,” it whispered. “I was trying to show you how many places they could go.” Pip tightened the camera strap.',
      scene: 'wind',
    },
  ],
  [
    {
      speaker: 'One letter arrived wearing a scarf.',
      text: '“A memory can be warm even when the world is cold.” Pip followed a trail of mitten-shaped footprints into a photograph covered in frost.',
      scene: 'rain',
    },
    {
      speaker: 'Pip took one careful step.',
      text: 'And then several rather less careful ones. Somewhere, Flurry was laughing into a very large cup of tea.',
      scene: 'home',
    },
  ],
  [
    {
      speaker: 'Behind the last snowflake was a book.',
      text: 'It was a book about other books. Pip opened it and found two corners touching each other, though they were on opposite sides of the page.',
      scene: 'night',
    },
    {
      speaker: '“Stories have shortcuts, too.”',
      text: 'Fold offered Pip a bookmark. “But only if you’re willing to see where the other end goes.”',
      scene: 'letter',
    },
  ],
  [
    {
      speaker: 'At the edge of the library, a little sea.',
      text: 'Every wave was a photograph that hadn’t happened yet. Pip’s pockets were full of stories. There was room for just one more.',
      scene: 'home',
    },
    {
      speaker: 'Tomorrow was waiting on the other shore.',
      text: '“You don’t have to know what comes next,” they said. “You only have to bring your camera.”',
      scene: 'rain',
    },
  ],
)

export const afterglowEnding: StoryFrame[] = [
  {
    speaker: 'Click. And a little space for tomorrow.',
    text: 'Pip photographed the sea, the wind, the frost and the folded page. The album was bigger on the inside now. Good albums usually are.',
    scene: 'home',
  },
  {
    speaker: 'The last page was still blank.',
    text: 'Pip smiled. An empty page wasn’t a missing memory. It was an invitation. “See you on the next little adventure.”',
    scene: 'letter',
  },
]
