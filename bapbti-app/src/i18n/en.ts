import type { Messages } from './ko';

export const en: Messages = {
  common: { back: 'Back', save: 'Save', cancel: 'Cancel', add: 'Add', share: 'Share', loading: 'Loading', error: 'Something went wrong', retry: 'Retry', people: '%{n} people', nth: '#%{n}', nthSuffix: 'th' },
  tabs: { groups: 'Groups', me: 'My BapBTI' },
  home: { title: 'My groups', create: 'New group', empty: 'No groups yet', createTitle: 'New group', groupName: 'Group name', yourName: 'Your name', recent: 'Last' },
  group: { members: '%{n} members', start: "What's for lunch?", recent: 'Recent meals', restrictions: "Things I can't eat", copyLink: 'Copy invite link', copied: 'Copied. Paste it in your chat', rename: 'Rename', yourName: 'Your name' },
  invite: { title: "You're invited to %{name}", who: 'Which one is you?', orNew: 'or', namePlaceholder: 'Type your name', join: 'Join', noLogin: 'No login. This device will remember you', notFound: 'This invite link is broken', taken: 'Someone already took that name' },
  session: {
    title: "What's for lunch?",
    status: { open: 'Collecting options', voting: 'Voting', done: 'Decided' },
    participants: '%{n} in', candidates: 'Options', addCandidate: 'Add an option', search: 'Search food',
    proposedBy: 'by %{name}', pitchPlaceholder: 'One-line pitch (optional)', writePitch: 'Add a pitch', remove: 'Remove', vetoed: "Out — %{name} can't eat it", startVoting: 'Start voting', hostOnly: 'Host only',
    pickUpTo: 'Pick up to 2', voted: '%{done} / %{total} voted', spin: 'Spin the wheel', spinHint: "Host only · you don't have to wait for everyone",
    spinning: 'Spinning…', pool: 'Only options with at least one vote', result: 'Result', toCard: 'See the card', maxVotes: 'Only 2',
  },
  card: { title: 'Result', heroPair: 'meals with %{name}', heroGroup: "this group's %{food}", heroMine: 'my %{food}', heroFirst: 'first %{food}', with: 'with %{names}', pairNth: 'Meal #%{n} with %{name}', groupNth: "This group's %{food} #%{n}", myNth: 'My %{food} #%{n}', first: 'First %{food}!', saved: 'Recorded', saveImage: 'Save image', share: 'Share' },
  me: {
    title: 'My BapBTI', typeLabel: 'Type · labels are temporary',
    types: { authority: 'The Regular', explorer: 'The Explorer', balanced: 'The Balanced', unknown: 'Not yet' },
    typeHint: { authority: 'Orders the same thing again', explorer: 'Tries the new thing first', balanced: 'Depends on the day', unknown: '3 more meals and you will know' },
    axisRepeat: 'Repeat', axisExplore: 'Explore', total: 'Meals', top: 'Most', distinct: 'Distinct', dogam: 'Collection %{n} / %{total}', people: 'Eaten with', times: '%{n}×',
    noMeals: "No meals yet. Open a group and hit What's for lunch?",
  },
  restrictions: {
    title: "Things I can't eat", hint: 'Set once. Those options drop out automatically', tags: 'Tags', foods: 'Specific foods', kind: 'Reason',
    kinds: { allergy: 'Allergy', dislike: 'Dislike', belief: 'Belief' },
    tag: { spicy: 'Spicy', seafood: 'Seafood', pork: 'Pork', beef: 'Beef', chicken: 'Chicken', gluten: 'Gluten', dairy: 'Dairy', nuts: 'Nuts', halal: 'Halal', vegetarian: 'Vegetarian', vegan: 'Vegan' },
  },
};
