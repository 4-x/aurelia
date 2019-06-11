import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

chai.use(sinonChai);

const testContext = require.context('.', true, /spec\.ts$/);
testContext.keys().forEach(testContext);
