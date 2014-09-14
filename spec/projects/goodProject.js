module.exports = {
	path: './spec/testProject/',
	steps: {
		one: {
			command: 'node',
			arguments: [ 'yay.js' ]
		},
		two: {
			command: 'node',
			arguments: [ 'yay.js' ]
		},
		three: {
			command: 'node',
			arguments: [ 'yay.js' ]
		},
		four: {
			command: 'node',
			arguments: [ 'boo.js' ],
			platform: 'nonsense'
		}
	}
};