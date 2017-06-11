import { nextDayState } from './day'
import * as tools from './tools'
import * as cards from '../../cards'

let { SUCCESS, FAILURE, UNUSED, USED } = tools

export const initialNightState = (state) => {
  return {
    ...state,
    stage: 'NIGHT',
    step: 'START_OF_GAME',
    statueHolder: null,
    tableIndex: -1,
    day: 0
  }
}

export const nextNightState = (state) => {
  return {
    ...state,
    stage: 'NIGHT',
    step: 'START_OF_NIGHT',
    tableIndex: -1,
    day: state.day + 1
  }
}

let banditsReqs = (alive, state) => {
  return tools.banditsWakeable(state) > 0
}

let thiefReqs = (alive, state) => {
  let thief = tools.getCardByRole(state.cards, 'thief')
  return thief.alive && thief.used !== SUCCESS && state.statueHolder.faction !== 'bandits'
}

let avengerReqs = (alive, state) => {
  let avenger = tools.getCardByRole(state.cards, 'avenger')
  return avenger.alive && avenger.used === UNUSED
}

let indiansReqs = (alive, state) => {
  return tools.indiansWakeable(state) > 0
}

let indiansWithStatueReqs = (alive, state) => {
  return state.statueHolder.faction === 'indians' && tools.indiansWakeable(state) > 0
}

coyoteReqs = (alive, state) => {
  return tools.isAlive('solitaryCoyote', state) && tools.indiansAlive(state) === 1
}

let whoreReqs = (alive, state) => {
  return areWakeable(alive, state) && (state.day === 0)
}

let sheriffReqs = (alive, state) => {
  return tools.isAlive('sheriff', state)
}

let areWakeable = (group, state) => {
  for (let a of group) {
    if (!tools.isWakeable(a, state)) {
      return false
    }
  }
  return true
}

let nextNight = (state) => {
  let tableIndex = state.tableIndex
  let order = [
    // {step: 'WHORE', alive: ['whore'], reqs: whoreReqs, stepOrder: orderWhore},
  //  {step: 'SHERIFF', alive: [], reqs: sheriffReqs, stepOrder: orderSheriff},
    // {step: 'PASTOR', alive: ['pastor'], reqs: areWakeable, stepOrder: orderPastor},
    {step: 'BANDITS', alive: [], reqs: banditsReqs, stepOrder: orderBandits},
  /*  {step: 'AVENGER', alive: ['avenger'], reqs: avengerReqs, stepOrder: orderAvenger},
    {step: 'THIEF', alive: [], reqs: thiefReqs, stepOrder: orderThief}, */
    {step: 'INDIANS_WAKEUP', alive: [], reqs: indiansReqs, stepOrder: orderIndiansWakeUp},
  /*  {step: 'SHAMAN', alive: ['shaman'], reqs: areWakeable, stepOrder: orderShaman}, */
    {step: 'INDIANS_KILL', alive: [], reqs: indiansReqs, stepOrder: orderIndiansKill},
    {step: 'INDIANS_WITH_STATUE', alive: [], reqs: indiansWithStatueReqs, stepOrder: orderIndiansWithStatue},
    {step: 'COYOTE', alive: [], reqs: coyoteReqs, stepOrder: orderCoyote},
  /*  {step: 'WARRIOR', alive: ['warrior'], reqs: areWakeable, stepOrder: orderWarrior},*/
    {step: 'INDIANS_SLEEP', alive: [], reqs: indiansReqs, stepOrder: orderIndiansSleep},
  ]
  while (tableIndex < (order.length - 1)) {
    tableIndex = tableIndex + 1
    if (order[tableIndex].reqs(order[tableIndex].alive, state)) {
      let s = {
        ...state,
        stepIndex: -1
      }
      let stepOrder = order[tableIndex].stepOrder(s)
      let next = nextSubstep(s, stepOrder)
      return {
        ...next,
        step: order[tableIndex].step,
        tableIndex: tableIndex
      }
    }
  }
  return initialDayState
}

let startOfGame = (state, action) => {
  let next = nextNight(state)
  switch (action.type) {
    case 'START':
      return {
        ...next,
        choosen: state.cards[0]
      }
    case 'MENU':
      return tools.getMenu(state)
    default:
      return state
  }
}

let startOfNight = (state, action) => {
  let next = nextNight(state)
  switch (action.type) {
    case 'NEXT':
      return {
        ...next,
        bandits: undefined,
        indians: undefined,
        citizens: undefined
      }
    case 'MENU':
      return tools.getMenu(state)
    default:
      return state
  }
}

let orderWhore = (state) => {
  let selectFrom = tools.selectFromWakeableExcept(['whore'], state)
  let whore = tools.getCardByRole(state.cards, 'whore')
  let choosen = state.choosen
  let order = [
    {substep: 'WAKE_UP_BY_ROLE', text: '', who: whore},
    {substep: 'SELECTION', from: selectFrom, text: 'Dziwka wybiera z kim chce spędzić noc', choosen: selectFrom[0]},
    {substep: 'WAKE_UP_BY_NAME', text: '', who: choosen},
    {substep: 'DISPLAY_CARD', who: choosen, text: 'Pokaż kartę dziwce'},
    {substep: 'INSTRUCTION', text: 'Wszyscy idą spać'}
  ]
  return order
}

let orderSheriff = (state) => {
  let selectFrom = tools.selectFromWakeableExcept([], state)
  let sheriff = tools.getCardByRole(state.cards, 'sheriff')
  let choosen = state.choosen
  let order = [
    {substep: 'WAKE_UP_BY_ROLE', text: '', who: sheriff},
    {substep: 'SELECTION', from: selectFrom, text: 'Szeryf wybiera kogo chce zaaresztować', choosen: selectFrom[0]},
    {substep: 'INSTRUCTION', text: 'Ogłoś: "Tej nocy szeryf aresztuje ' + choosen.name + '"'},
    {substep: 'INSTRUCTION', text: 'Wszyscy idą spać'}
  ]
  return order
}

let orderPastor = (state) => {
  let selectFrom = tools.selectFromWakeableExcept(['pastor'], state)
  let pastor = tools.getCardByRole(state.cards, 'pastor')
  let choosen = state.choosen
  let order = [
    {substep: 'WAKE_UP_BY_ROLE', text: '', who: pastor},
    {substep: 'SELECTION', from: selectFrom, text: 'Pastor wybiera kogo chce wyspowiadać', choosen: selectFrom[0]},
    {substep: 'DISPLAY_FACTION', who: choosen, text: 'Pokaż frakcję pastorowi'},
    {substep: 'INSTRUCTION', text: 'Wszyscy idą spać'}
  ]
  return order
}

let orderBandits = (state) => {
  let selectFrom = tools.selectFromWakeableExcept(tools.getFactionMembers('bandits', state), state);
  let bandits = tools.getFactionMembers('bandits', state);
  let choosen = state.choosen;
  let order = [
    {substep: 'INSTRUCTION', text: 'Obudź bandytów: "Wstają bandyci"'}
  ]
  if (state.statueHolder !== null && state.statueHolder.faction !== 'bandits') {
    order.push({substep: 'SELECTION', from: selectFrom, text: 'Bandyci wybierają kogo chcą przeszukać', choosen: selectFrom[0]})
  } else {
    order.push({none: true})
  }
  if (state.banditsStole) {
    order.push({substep: 'INSTRUCTION', text: 'Bandyci zdobyli posążek'})
  } else {
    order.push({none: true})
  }
  if (state.statueHolder === null || state.statueHolder.faction === 'bandits') {
    order.push({substep: 'SELECTION', from: bandits, text: 'Wybieją kto będzie miał posążek.', choosen: bandits[0]})
  } else {
    order.push({none: true})
  }
  order.push({substep: 'INSTRUCTION', text: 'Wszyscy idą spać'})
  return order
}

let orderAvenger = (state) => {
  let notBandits = tools.selectFromWakeableExcept(tools.getFactionMembers('bandits', state), state)
  let avenger = tools.getCardByRole(state.cards, 'avenger')
  let choosen = state.choosen
  let order = [
    {substep: 'WAKE_UP_BY_ROLE', text: '', who: avenger},
    {substep: 'CHOICE', instruction: 'Zapytaj', text: 'Czy mściciel chce użyć swojej umiejętności?'}
  ]
  if (state.useNow) {
    order.push({substep: 'SELECTION', from: notBandits, text: 'Kogo mściciel chce zabić?', choosen: notBandits[0]})
    order.push({substep: 'INSTRUCTION', instruction: 'Ogłoś', text: 'Mściciel zabija ' + state.choosen.name + ', jego rola to: ' + cards[state.choosen.faction][state.choosen.role].name})
  } else {
    order.push({substep: 'INSTRUCTION',
      instruction: 'Ogłoś',
      text: 'Mściciel zrezygnował z użycia swojej umiejętności tej nocy'})
    order.push({none: true})
  }
  if (avenger.used === SUCCESS && state.useNow) {
    order.push({substep: 'INSTRUCTION', instruction: 'Ogłoś', text: 'Bandyci zdobyli posążek'})
  } else {
    order.push({none: true})
  }
  order.push({substep: 'INSTRUCTION', text: 'Mściciel idzie spać'})
  return order
}

let orderThief = (state) => {
  let notBandits = tools.selectFromWakeableExcept(getFactionMembers('bandits', state), state);
  let thief = tools.getCardByRole(state.cards, 'thief');
  if(thief.used === undefined){
    thief.used = UNUSED;
  }
  let choosen = state.choosen
  let order = [
    {substep: 'WAKE_UP_BY_ROLE', text: '', who: thief}
  ]
  if (thief.used === UNUSED) {
    order.push({substep: 'CHOICE', instruction: 'Zapytaj', text: 'Czy złodziej chce użyć swojej umiejętności?'})
  } else {
    order.push({substep: 'INSTRUCTION',
      instruction: 'Złodziej już użył umiejętności, ale mu się nie udało. Zasymuluj wybór.',
      text: 'Czy złodziej chce użyć swojej umiejętności?'})
  }
  if (thief.used === UNUSED && state.useNow) {
    order.push({substep: 'SELECTION', from: notBandits, text: 'Kogo złodziej chce okraść?', choosen: notBandits[0]})
  } else {
    order.push({substep: 'INSTRUCTION',
      instruction: 'Złodziej już użył umiejętności lub nie chce użyć jej teraz. Zasymuluj wybór osoby.',
      text: 'Kogo złodziej chce okraść?'})
  }
  if (thief.used === SUCCESS && state.useNow) {
    order.push({substep: 'INSTRUCTION', instruction: 'Ogłoś', text: 'Bandyci zdobyli posążek'})
  } else {
    order.push({substep: 'INSTRUCTION', instruction: 'Ogłoś', text: 'Złodziej użył umiejętności lub nie'})
  }
  order.push({substep: 'INSTRUCTION', text: 'Złodziej idzie spać'})
  return order
}

let orderIndiansWakeUp = (state) => {
  let order = [
    {substep: 'INSTRUCTION', instruction: 'Obudź frakcję', text: 'Budzą się indianie'}
  ]
  return order
}

let orderShaman = (state) => {
  let notIndians = tools.selectFromWakeableExcept(getFactionMembers('indians', state), state);
  let shaman = tools.getCardByRole(state.cards, 'shaman');
  if(shaman.used === undefined){
    shaman.used = UNUSED;
  }
  let choosen = state.choosen
  let order = [
    {substep: 'INSTRUCTION', text: 'Działa szaman'}
  ]
  if (shaman.used === UNUSED) {
    order.push({substep: 'CHOICE', instruction: 'Zapytaj', text: 'Czy szaman chce użyć swojej umiejętności?'})
  } else {
    order.push({substep: 'INSTRUCTION',
      instruction: 'Szaman już użył umiejętności. Zasymuluj wybór.',
      text: 'Czy szaman chce użyć swojej umiejętności?'})
  }
  if (shaman.used === UNUSED && state.useNow === 1) {
    order.push({substep: 'SELECTION', from: notIndians, text: 'Kogo szaman chce sprawdzić?', choosen: notIndians[0]})
  } else {
    order.push({substep: 'INSTRUCTION',
      instruction: 'Szaman już użył umiejętności lub nie chce użyć jej teraz. Zasymuluj wybór osoby.',
      text: 'Kogo szaman chce sprawdzić?'})
  }
  if (shaman.used === USED && state.useNow === 1) {
    order.push({substep: 'DISPLAY_CARD', who: choosen, text: 'Pokaż kartę szamanowi'})
  } else {
    order.push({none: true})
  }
  order.push({substep: 'INSTRUCTION', text: 'Szaman użył umiejętności lub nie'})
  return order
}

let orderIndiansKill = (state) => {
  let selectFrom = tools.selectFromWakeableExcept(getFactionMembers('indians', state), state);
  let choosen = state.choosen;
  let order = [
    {substep: 'SELECTION', from: selectFrom, text: 'Indianie wybierają kogo chcą zabić', choosen: selectFrom[0]},
    {substep: 'INSTRUCTION', text: 'Ogłoś: "Tej nocy indianie zabijają ' + state.choosen.name + ', jego rola to: ' + cards[state.choosen.faction][state.choosen.role].name + '"'},
  ]
  return order
}

let orderIndiansWithStatue = (state) => {
  let selectFrom = tools.selectFromWakeableExcept(getFactionMembers('indians', state), state);
  let choosen = state.choosen;
  let order = [
    {substep: 'SELECTION', from: selectFrom, text: 'Indianie mają posążek, więc zabijają drugą osobę. Indianie wybierają kogo chcą zabić', choosen: selectFrom[0]},
    {substep: 'INSTRUCTION', text: 'Ogłoś: "Tej nocy indianie zabijają ' + state.choosen.name + ', jego rola to: ' + cards[state.choosen.faction][state.choosen.role].name + '"'},
  ]
  return order
}

let orderCoyote = (state) => {
  let selectFrom = tools.selectFromWakeableExcept(getFactionMembers('indians', state), state);
  let choosen = state.choosen;
  let order = [
    {substep: 'SELECTION', from: selectFrom, text: 'Samotny kojot jest ostatnim żyjącym indianinem. Wybiera kogo chce zabić', choosen: selectFrom[0]},
    {substep: 'INSTRUCTION', text: 'Ogłoś: "Tej nocy szaman zabija ' + state.choosen.name + ', jego rola to: ' + cards[state.choosen.faction][state.choosen.role].name + '"'},
  ]
  return order
}

let orderWarrior = (state) => {
  let selectFrom = tools.selectFromWakeableExcept(['pastor'], state)
  let pastor = tools.getCardByRole(state.cards, 'pastor')
  let choosen = state.choosen
  let order = [
    {substep: 'WAKE_UP_BY_ROLE', text: '', who: pastor},
    {substep: 'SELECTION', from: selectFrom, text: 'Pastor wybiera kogo chce wyspowiadać', choosen: selectFrom[0]},
    {substep: 'DISPLAY_FACTION', who: choosen, text: 'Pokaż frakcję pastorowi'},
    {substep: 'INSTRUCTION', text: 'Wszyscy idą spać'}
  ]
  return order
}

let orderIndiansSleep = (state) => {
  let order = [
    {substep: 'INSTRUCTION', instruction: '', text: 'Indianie idą spać'}
  ]
  return order
}

let nextSubstep = (state, order) => {
  let stepIndex = state.stepIndex
  do {
    stepIndex++
  } while (stepIndex < order.length && order[stepIndex].none)
  if (stepIndex === order.length) {
    return {
      ...state,
      instruction: '',
      text: '',
      ...nextNight(state)
    }
  }
  return {
    ...state,
    instruction: '',
    text: '',
    ...order[stepIndex],
    stepIndex: stepIndex
  }
}

let whore = (state, action) => {
  let order = orderWhore(state)
  let next = nextSubstep(state, order)
  switch (action.type) {
    case 'MENU':
      return tools.getMenu(state)
    case 'NEXT':
      return next
    case 'SUBMIT':
      return next
    case 'SELECT':
      return {
        ...state,
        choosen: action.choosen
      }
    default:
      return state
  }
}

let sheriff = (state, action) => {
  let order = orderSheriff(state)
  let next = nextSubstep(state, order)
  switch (action.type) {
    case 'MENU':
      return tools.getMenu(state)
    case 'NEXT':
      return next
    case 'SUBMIT':
      return {
        ...next,
        inPrison: state.choosen
      }
    case 'SELECT':
      return {
        ...state,
        choosen: action.choosen
      }
    default:
      return state
  }
}

let pastor = (state, action) => {
  let order = orderPastor(state)
  let next = nextSubstep(state, order)
  switch (action.type) {
    case 'MENU':
      return tools.getMenu(state)
    case 'NEXT':
      return next
    case 'SUBMIT':
      return next
    case 'SELECT':
      return {
        ...state,
        choosen: action.choosen
      }
    default:
      return state
  }
}

let bandits = (state, action) => {
  let order = orderBandits(state)
  let next = nextSubstep(state, order)
  switch (action.type) {
    case 'MENU':
      return tools.getMenu(state)
    case 'NEXT':
      return next
    case 'SUBMIT':
      return {
        ...next,
        statueHolder: state.choosen
      }
    case 'SELECT':
      return {
        ...state,
        choosen: action.choosen
      }
    default:
      return state
  }
}

let avenger = (state, action) => {
  let s = state
  switch (action.type) {
    case 'MENU':
      s = tools.getMenu(state)
      break
    case 'NEXT':
      break;
    case 'SUBMIT':
      s = {
        ...tools.killByRole(state.choosen.role, state),
        statueHolder: tools.getCardByRole(state.cards, 'avenger')
      };
      break;
    case 'CHOICE':
      s = {
        ...s,
        useNow: action.choice
      };
      break;
    case 'SELECT':
    let used = '';
    let statueHolder = state.statueHolder;
      if(action.choosen.role === state.statueHolder.role){
        used = SUCCESS;
      }
      break
    case 'SELECT':
      let used = ''
      let statueHolder = state.statueHolder
      if (action.choosen.role === state.statueHolder.role) {
        used = SUCCESS
        statueHolder = tools.getCardByRole('avenger', state)
      } else {
        used = FAILURE
      }
      s = {
        ...s,
        choosen: action.choosen,
        used: used,
        statueHolder: statueHolder
      }
      return s
    default:
      s = state
  }
  let order = orderAvenger(s)
  let next = nextSubstep(s, order)
  return next
}

let thief = (state, action) => {
  let s = state
  let statueHolder = state.statueHolder
  switch (action.type) {
    case 'MENU':
      s = tools.getMenu(state)
      break
    case 'NEXT':
      break;
    case 'SUBMIT':
    let used = FAILURE
    if(action.choosen.role === state.statueHolder.role){
      used = SUCCESS;
      statueHolder = tools.getCardByRole(state.cards, 'thief')
    }
    s = {
      ...s,
      cards: s.cards.map((card) => {
        if (card.role === 'thief') {
          return { ...card, used: used }
        } else {
          return card
        }
      }),
      statueHolder: statueHolder
    };
      break;
    case 'CHOICE':
      s = {
        ...s,
        useNow: action.choice
      };
      break;
    case 'SELECT':
      return {
        ...s,
        choosen: action.choosen
      };
    default:
      s = state
  }
  let order = orderThief(s)
  let next = nextSubstep(s, order)
  return next
}

let indiansWakeUp = (state, action) => {
  let order = orderIndiansWakeUp(state)
  let next = nextSubstep(state, order)
  switch (action.type) {
    case 'MENU':
      return tools.getMenu(state)
    case 'NEXT':
      return next
    default:
      return state
  }
}

let shaman = (state, action) => {
  let s = Object.assign({}, state)
  let useNow = action.choice
  switch (action.type) {
    case 'MENU':
      s = tools.getMenu(state)
      break
    case 'NEXT':
      break;
    case 'SUBMIT':
      s.cards = s.cards.map((card) => {
        if (card.role === 'shaman') {
          return {
            ...card,
            used: USED
          }
        } else {
          return card
        }
      })
      break
    case 'CHOICE':
      s = {
        ...s,
        useNow: useNow
      }
      break
    case 'SELECT':
      return {
        ...s,
        choosen: action.choosen
      }
    default:
      s = state
  }
  let order = orderShaman(s)
  let next = nextSubstep(s, order)
  return next
}

let indiansKill = (state, action) => {
  let s = Object.assign({}, state);
  let statueHolder = state.statueHolder
  switch (action.type) {
    case 'MENU':
      s = tools.getMenu(state);
      break;
    case 'NEXT':
      break;
    case 'SUBMIT':

    if(state.choosen.role === state.statueHolder.role){
      statueHolder = getFactionMembers('indians', state)[0];
    }
      s = {
        ...tools.killByRole(state.choosen.role, {...s,
        statueHolder: statueHolder})
      };
      break;
    case 'SELECT':
      s = {
        ...s,
        choosen: action.choosen
      };
      return s;
    default:
      s = state;
  }
  let order = orderIndiansKill(s);
  let next = nextSubstep(s, order);
  return next;
}

let indiansWithStatue = (state, action) => {
  let s = Object.assign({}, state);
  switch (action.type) {
    case 'MENU':
      s = tools.getMenu(state);
      break;
    case 'NEXT':
      break;
    case 'SUBMIT':
      s = tools.killByRole(state.choosen.role, s)
      break;
    case 'SELECT':
      s = {
        ...s,
        choosen: action.choosen
      };
      return s;
    default:
      s = state;
  }
  let order = orderIndiansWithStatue(s);
  let next = nextSubstep(s, order);
  return next;
}

let coyote = (state, action) => {
  let s = Object.assign({}, state);
  let statueHolder = state.statueHolder
  switch (action.type) {
    case 'MENU':
      s = tools.getMenu(state);
      break;
    case 'NEXT':
      break;
    case 'SUBMIT':
    if(state.choosen.role === state.statueHolder.role){
      statueHolder = getFactionMembers('indians', state)[0];
    }
      s = {
        ...tools.killByRole(state.choosen.role, {...s,
        statueHolder: statueHolder})
      };
      break;
    case 'SELECT':
      s = {
        ...s,
        choosen: action.choosen
      };
      return s;
    default:
      s = state;
  }
  let order = orderCoyote(s);
  let next = nextSubstep(s, order);
  return next;
}

let indiansSleep = (state, action) => {
  let order = orderIndiansSleep(state)
  let next = nextSubstep(state, order)
  switch (action.type) {
    case 'MENU':
      return tools.getMenu(state)
    case 'NEXT':
      return next
    default:
      return state
  }
}

export const night = (state, action) => {
  switch (state.step) {
    case 'START_OF_GAME':
      return startOfGame(state, action)
    case 'START_OF_NIGHT':
      return startOfNight(state, action)
    case 'MENU':
      return tools.menu(state, action)
    case 'WHORE':
      return whore(state, action)
    case 'SHERIFF':
      return sheriff(state, action)
    case 'PASTOR':
      return pastor(state, action)
    case 'BANDITS':
      return bandits(state, action)
    case 'AVENGER':
      return avenger(state, action)
    case 'THIEF':
      return thief(state, action)
    case 'INDIANS_WAKEUP':
      return indiansWakeUp(state, action)
    case 'SHAMAN':
      return shaman(state, action)
    case 'INDIANS_KILL':
      return indiansKill(state, action)
    case 'INDIANS_WITH_STATUE':
      return indiansWithStatue(state, action)
    case 'COYOTE':
      return coyote(state, action)
    case 'INDIANS_SLEEP':
      return indiansSleep(state, action)
    default:
      return state
  }
}
