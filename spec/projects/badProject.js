module.exports = {
	path: './spec/testProject/',
	steps: {
		one: {
			command: 'node',
			arguments: [ 'yay.js' ]
		},
		two: {
			command: 'node',
			arguments: [ 'boo.js' ]
		},
		three: {
			command: 'node',
			arguments: [ 'yay.js' ]
		}
	}
};