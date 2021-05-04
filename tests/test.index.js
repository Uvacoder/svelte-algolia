import 'dotenv/config'
import test from 'ava'
import algoliasearch from 'algoliasearch'

import pokedex from './fixtures/pokedex.json'
import { indexAlgolia } from '../src/main.js'

const { ALGOLIA_APP_ID: appId, ALGOLIA_ADMIN_KEY: apiKey } = process.env
const client = algoliasearch(appId, apiKey)

const indices = [{ name: `pokedex`, getData: () => pokedex }]
const config = { appId, apiKey, indices }

async function resetApp() {
  const { items } = await client.listIndices()
  const ops = items.map((idx) => ({ indexName: idx.name, action: `delete` }))
  await client.multipleBatch(ops).wait()
}

test.serial.beforeEach(async (t) => {
  await resetApp()
  const { items } = await client.listIndices()
  t.is(items.length, 0)
})

const assertIndex = async (name, t) => {
  const index = client.initIndex(name)
  const { hits } = await index.search(``)
  t.is(hits.length, pokedex.length)
  const algolia10 = hits.find((itm) => itm.objectID === `10`)
  const local10 = pokedex.find((itm) => itm.objectID === `10`)
  t.true(Object.keys(local10).every((key) => algolia10[key]))
}

test.serial(`can create an index in overwrite mode`, async (t) => {
  await indexAlgolia(config)
  await assertIndex(indices[0].name, t)
})

test.serial(`can create an index in partialUpdate mode`, async (t) => {
  await indexAlgolia({ ...config, partialUpdates: true })
  await assertIndex(indices[0].name, t)
})
