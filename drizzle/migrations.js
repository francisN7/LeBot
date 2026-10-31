// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './0000_aspiring_unicorn.sql';
import m0001 from './0001_conscious_hannibal_king.sql';
import m0002 from './0002_slow_pepper_potts.sql';
import journal from './meta/_journal.json';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
  },
};
