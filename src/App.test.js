import React, { Component } from 'react';
import web3 from './web3'

import './App.css'
import abiDutchX from './abiDutchX.json'
import abiWeth from './abiWeth.json'

const addressesDutchX = {
  1: '0xaf1745c0f8117384dfa5fff40f824057c70f2ed3',
  4: '0x4e69969d9270ff55fc7c5043b074d4e45f795587',
  42: '0x4183931cce346feece44eae2cf14d84c3347d779'
}

const addressesWeth = {
  1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  4: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
  42: '0xd0a1e359811322d97991e03f863a0c30c2cf029c'
}

// Store the instances of the contracts per network
const contractsCache = {}


class App extends Component {
  state = {
    amount: '',
    message: null,
    isError: false,
    validAmount: false
  }

  handleError = error => {
    this.setState({
      isError: true,
      message: (
        <div>
          <strong>Internal error</strong>
          <p>{ error.message }</p>
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
            onChange={ this.onInputChange }
            placeholder="Enter the amount..."
            />
          <button onClick={ this.getBalances }>Get balances</button>
          <br />
          <button onClick={ this.wrapEther } disabled={ !this.state.validAmount }>Wrap Ether</button>
          <button onClick={ this.setAllowance } disabled={ !this.state.validAmount }>Set Allowance</button>
          <button onClick={ this.deposit } disabled={ !this.state.validAmount }>Deposit</button>
          <br />
          <button onClick={ this.unwrapEther } disabled={ !this.state.validAmount }>Unwrap Ether</button>
          <button onClick={ this.withdraw } disabled={ !this.state.validAmount }>Withdraw</button>

          { this.state.message && (
            <div className={ 'message' + (this.state.isError ? ' error' : '') }>
              <span className="times" onClick={ () => this.setState({ message: null, isError: false }) }>&times;</span>
              { this.state.message }
            </div>
          )}
        </header>
      </div>
    )
  }

  getBalances = async () => {
    try {
      const [ account ] = await web3.eth.getAccounts()
      const { weth, dutchx } = await _getContracts()
      const addressDutchX = dutchx.options.address
      const addressWeth = weth.options.address
  
      console.log('Get balances for %s', account)
  
      const etherBalancePromise = web3.eth
        .getBalance(account)
        .then(web3.utils.fromWei)
  
      const wethBalancePromise = weth.methods
        .balanceOf(account)
        .call()
        .then(web3.utils.fromWei)
  
      const wethAllowancePromise = weth.methods
        .allowance(account, addressDutchX)
        .call()
        .then(web3.utils.fromWei)
  
      const dutchxBalancePromise = dutchx.methods
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
    } catch (error) {
      this.handleError(error)
    }
  }

  wrapEther = async () => {
    const [ account ] = await web3.eth.getAccounts()
    const { weth } = await _getContracts()
    const amount = this.state.amount

    const txReceipt = await weth.methods
      .deposit()
      .send({
        from: account,
        value: web3.utils.toWei(amount)
      })
      .catch(this.handleError)

    if (txReceipt){
      const { transactionHash } = txReceipt
      this.setState({
        message: (
          <div>
            <p>Wraped { amount } Ether.</p>
            <p>See transaction in EtherScan:<br />
              <a href={ 'https://rinkeby.etherscan.io/tx/' + transactionHash }>{ transactionHash }</a></p>
          </div>
        )
      })
    }
  }

  unwrapEther = async () => {
    const [ account ] = await web3.eth.getAccounts()
    const { weth } = await _getContracts()
    const amount = this.state.amount

    const txReceipt = await weth.methods
      .withdraw(web3.utils.toWei(amount))
      .send({
        from: account
      })
      .catch(this.handleError)

    if (txReceipt){
      const { transactionHash } = txReceipt
      this.setState({
        message: (
          <div>
            <p>Wraped { amount } Ether.</p>
            <p>See transaction in EtherScan:<br />
              <a href={ 'https://rinkeby.etherscan.io/tx/' + transactionHash }>{ transactionHash }</a></p>
          </div>
        )
      })      
    }
  }

  setAllowance = async () => {
    const [ account ] = await web3.eth.getAccounts()
    const { weth, dutchx } = await _getContracts()
    const amount = this.state.amount
    const addressDutchX = dutchx.options.address

    const txReceipt = await weth.methods
      .approve(addressDutchX, web3.utils.toWei(amount))
      .send({
        from: account
      })
      .catch(this.handleError)

    if (txReceipt){
      const { transactionHash } = txReceipt
      this.setState({
        message: (
          <div>
            <p>Allowance changed to { amount }.</p>
            <p>See transaction in EtherScan:<br />
              <a href={ 'https://rinkeby.etherscan.io/tx/' + transactionHash }>{ transactionHash }</a></p>
          </div>
        )
      })
    }
  }

  deposit = async () => {
    const [ account ] = await web3.eth.getAccounts()
    const { weth, dutchx } = await _getContracts()
    const amount = this.state.amount
    const addressWeth = weth.options.address

    // See: https://github.com/gnosis/dx-contracts/blob/master/contracts/DutchExchange.sol#L351
    const txReceipt = await dutchx.methods
      .deposit(addressWeth, web3.utils.toWei(amount))
      .send({
        from: account
      })
      .catch(this.handleError)

    if (txReceipt){
      const { transactionHash } = txReceipt
      this.setState({
        message: (
          <div>
            <p>Deposited { amount } WETH into the DutchX.</p>
            <p>See transaction in EtherScan:<br />
              <a href={ 'https://rinkeby.etherscan.io/tx/' + transactionHash }>{ transactionHash }</a></p>
          </div>
        )
      })
    }
  }

  withdraw = async () => {
    const [ account ] = await web3.eth.getAccounts()
    const { weth, dutchx } = await _getContracts()
    const amount = this.state.amount
    const addressWeth = weth.options.address

    // See: https://github.com/gnosis/dx-contracts/blob/master/contracts/DutchExchange.sol#L351
    const txReceipt = await dutchx.methods
      .withdraw(addressWeth, web3.utils.toWei(amount))
      .send({
        from: account
      })
      .catch(this.handleError)

    if (txReceipt){
      const { transactionHash } = txReceipt
      this.setState({
        message: (
          <div>
            <p>Deposited { amount } WETH into the DutchX.</p>
            <p>See transaction in EtherScan:<br />
              <a href={ 'https://rinkeby.etherscan.io/tx/' + transactionHash }>{ transactionHash }</a></p>
          </div>
        )
      })
    }
  }

  onInputChange = event => {
    const amount = event.target.value
    let validAmount
    if (amount) {
      validAmount = amount.match(/^-?\d*(\.\d+)?$/)

      if (validAmount) {
        validAmount = parseFloat(validAmount) > 0
      }
    } else {
      validAmount = false
    }
    this.setState({
      amount,
      validAmount
    })
  }
}


const _getContracts = async () => {
  const networkId = await web3.eth.net.getId()
  let contracts = contractsCache[networkId]
  if (!contracts) {
    const addressWeth = addressesWeth[networkId]
    const addressDutchX = addressesDutchX[networkId]
    if (!addressWeth || !addressDutchX) {
      throw new Error('Unknown network: ' + networkId)
    }
    contracts = {
      weth: new web3.eth.Contract(abiWeth, addressWeth),
      dutchx: new web3.eth.Contract(abiDutchX, addressDutchX)
    }
  }

  return contracts
}


export default App