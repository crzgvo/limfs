test('Ambiente jsdom funcionando corretamente', () => {
  document.body.innerHTML = '<div id="app">Hello, Jest!</div>';
  const appDiv = document.getElementById('app');
  expect(appDiv).not.toBeNull();
  expect(appDiv.textContent).toBe('Hello, Jest!');
});