const test = require('ava')
const Runtime = require('../domain/runtime')
const { startsWith } = require('ramdasauce')

const createRuntime = () => {
  const r = new Runtime()
  r.load(`${__dirname}/../fixtures/good-plugins/generate`)
  return r
}

test('generates a simple file', async t => {
  const context = await createRuntime().run({
    pluginName: 'generate',
    rawCommand: 'simple'
  })

  t.is(context.result, 'simple file\n')
})

test('supports props', async t => {
  const context = await createRuntime().run({
    pluginName: 'generate',
    rawCommand: 'props Greetings_and_salutations',
    options: { stars: 5 }
  })

  t.is(
    context.result,
    `greetingsAndSalutations world
red
green
blue
*****
`
  )
})

test('detects missing templates', async t => {
  try {
    const context = await createRuntime().run({
      pluginName: 'generate',
      rawCommand: 'missing'
    })
  } catch (e) {
    t.true(startsWith('template not found', e.message))
  }
})

test('supports directories', async t => {
  const context = await createRuntime().run({
    pluginName: 'generate',
    rawCommand: 'special location'
  })

  t.is(
    context.result,
    `location
`
  )
})