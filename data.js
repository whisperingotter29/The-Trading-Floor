/* ============ APP STATE ============ */
/* The floor starts empty: no accounts, no posts, no strategies.
   Everything below is filled in by people who sign up and post. */
const USERS = {};
let ME = null; // handle of the signed-in account, null until someone creates one

const STRATEGIES = [];
const POSTS = [];

const state = {
  posts: POSTS, strategies: STRATEGIES, users: USERS,
  liked: new Set(), saved: new Set(), following: new Set(),
  followedStrategies: new Set(),
  draft: null,
};
const U = (h) => state.users[h];
const S = (id) => state.strategies.find((s) => s.id === id);
const P = (id) => state.posts.find((p) => p.id === id);
