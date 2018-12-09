import React, { Component } from 'react'
import './App.css'
// ...
import web3 from './web3';

// Include the ABIs and the addresses
import abiDutchX from './abiDutchX'
import abiWeth from './abiWeth'

const addressDutchX = '0x4e69969d9270ff55fc7c5043b074d4e45f795587'
const addressWeth = '0xc778417e063141139fce010982780140aa0cd5ab'

  
class App extends Component {
  state = {
    amount: '',
    message: null
  }
  componentDidMount () {
    // Instanciate the contract
    this.dutchx = new web3.eth.Contract(abiDutchX, addressDutchX)
    this.weth = new web3.eth.Contract(abiWeth, addressWeth)

    // Test to get some basic data
    this.dutchx.methods
      .auctioneer()
      .call()
      .then(auctioneer => {
        console.log('The DutchX Auctioneer is: %s', auctioneer)
      })
      .catch(console.error)
  }
  deposit = async () => {
    // Get the first account from Metamask
    const [ account ] = await web3.eth.getAccounts()
    this.setState({
      message: `Your account is ${account}`
    })
  }
  getBalances = async () => {
    const [ account ] = await web3.eth.getAccounts()
    console.log('Get balances for %s', account)

    const etherBalancePromise = web3.eth
      .getBalance(account)
      .then(web3.utils.fromWei)

    const wethBalancePromise = this.weth.methods
      .balanceOf(account)
      .call()
      .then(web3.utils.fromWei)

    const wethAllowancePromise = this.weth.methods
      .allowance(account, addressDutchX)
      .call()
      .then(web3.utils.fromWei)

    const dutchxBalancePromise = this.dutchx.methods
      .balances(addressWeth, account)
      .call()
      .then(web3.utils.fromWei)

    // Wait for all promises
    const [
      etherBalance,
      wethBalance,
      wethAllowance,
      dutchxBalance,
    ] = await Promise.all([
      etherBalancePromise,
      wethBalancePromise,
      wethAllowancePromise,
      dutchxBalancePromise,
    ])

    this.setState({
      message: (
        <div>
          <strong>Balances</strong>
          <ul>
            <li><strong>Ether</strong>: { etherBalance }</li>
            <li><strong>WETH balance</strong>: { wethBalance }</li>
            <li><strong>WETH allowance for DutchX</strong>: { wethAllowance }</li>
            <li><strong>Balance in DutchX</strong>: { dutchxBalance }</li>
          </ul>
        </div>
      )
    })
  }

      
   render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Deposit WETH into the DutchX</h1>

          <label>Amount of WETH:</label>
          <input          
            value={ this.state.amount }
            onChange={ event => this.setState({ amount: event.target.value }) }
            placeholder="Enter the amount..."
            />
 
          <button onClick={ this.deposit }>Deposit</button>
          <button onClick={ this.getBalances }>Get balances</button>

          { this.state.message && (
            <div className="message">
              <span className="times" onClick={ () => this.setState({ message: null }) }>&times;</span>
              { this.state.message }
            </div>
          )}
        </header>
      </div>
    )
  }
}

export default App