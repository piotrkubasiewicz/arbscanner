import React, { Component } from 'react'
import './App.css'
// ...
import web3 from './web3';

// Include the ABIs and the addresses
import abiDutchX from './abiDutchX'
import abiWeth from './abiWeth'
const axios = require('axios');

const addressDutchX = '0x4e69969d9270ff55fc7c5043b074d4e45f795587'
const addressWeth = '0xc778417e063141139fce010982780140aa0cd5ab'



const BASE_URL = 'https://dutchx.d.exchange/api/v1'

/*function  printTokenInfo({ symbol, name, address, decimals }) 
  {
    console.log(`  - Token ${symbol}:`)
    console.log('      Name: ' + name)
    console.log('      Address: ' + address)
    console.log('      Decimals: ' + decimals)
  }
  */

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
      const [ account ] = await web3.eth.getAccounts()
      const amount = this.state.amount
  
      // See: https://github.com/gnosis/dx-contracts/blob/master/contracts/DutchExchange.sol#L351
      const txReceipt = await this.dutchx.methods
        .deposit(addressWeth, web3.utils.toWei(amount))
        .send({
          from: account
        })
  
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
  getRunningTokenPairs = async () =>{
    
    console.log('another way ')
    this.dutchx.getPastEvents('NewTokenPair', {
      fromBlock: 0,
      toBlock: 'latest'
  }, function(error, events){ console.log('events+error');
                              console.log(events);
                              console.log(error); 
                            })
  .then(function(events){
    console.log('events')
    console.log(events) // same results as the optional callback above
  });
    //const [ runningTokenPairs] = await this.dutchx.methods
    //.getApprovedAddressesOfList()
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
  wrapEther = async () => {
    const [ account ] = await web3.eth.getAccounts()
    const amount = this.state.amount

    const txReceipt = await this.weth.methods
      .deposit()
      .send({
        from: account,
        value: web3.utils.toWei(amount)
      })

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
  setAllowance = async () => {
    const [ account ] = await web3.eth.getAccounts()
    const amount = this.state.amount

    const txReceipt = await this.weth.methods
      .approve(addressDutchX, web3.utils.toWei(amount))
      .send({
        from: account
      })

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
   getInfoFromDx = async()=>   {
    const tokenPairs = await axios.get(BASE_URL + '/markets')
    /*WORKED
    axios.get(BASE_URL + '/markets').then(function(response)
                                          {console.log(response);
                                            console.log(response.data.data);
                                            this.tokenPairs = response.data.data;
                                          })
                                          .catch(function(error){
                                            console.log(error);
                                          })
    */
                                          // Get all the token pairs (markets)
    console.log(tokenPairs)
    this.setState({
      message: (
        <div>
          <p>tokenPairs are :</p>
          {tokenPairs.data.data[0].tokenA.symbol}:{tokenPairs.data.data[0].tokenA.address}
          <br></br>
          {tokenPairs.data.data[0].tokenB.symbol}:{tokenPairs.data.data[0].tokenB.address}
          <p>:</p>
          {tokenPairs.data.data[1].tokenA.symbol}:{tokenPairs.data.data[1].tokenA.address}
          <br></br>
          {tokenPairs.data.data[1].tokenB.symbol}:{tokenPairs.data.data[1].tokenB.address}
          <p>:</p>
          {tokenPairs.data.data[1].tokenA.symbol}:{tokenPairs.data.data[1].tokenA.address}
          <br></br>
          {tokenPairs.data.data[1].tokenB.symbol}:{tokenPairs.data.data[1].tokenB.address}
          <p>:</p>
          {tokenPairs.data.data[2].tokenA.symbol}:{tokenPairs.data.data[2].tokenA.address}
          <br></br>
          {tokenPairs.data.data[2].tokenB.symbol}:{tokenPairs.data.data[2].tokenB.address}
          <p>:</p>
          {tokenPairs.data.data[3].tokenA.symbol}:{tokenPairs.data.data[3].tokenA.address}
          <br></br>
          {tokenPairs.data.data[3].tokenB.symbol}:{tokenPairs.data.data[3].tokenB.address}
          <p>:</p>
          {tokenPairs.data.data[4].tokenA.symbol}:{tokenPairs.data.data[4].tokenA.address}
          <br></br>
          {tokenPairs.data.data[4].tokenB.symbol}:{tokenPairs.data.data[4].tokenB.address}
          <p>:</p>
          {tokenPairs.data.data[5].tokenA.symbol}:{tokenPairs.data.data[5].tokenA.address}
          <br></br>
          {tokenPairs.data.data[5].tokenB.symbol}:{tokenPairs.data.data[5].tokenB.address}
          <p>:</p>
          {tokenPairs.data.data[6].tokenA.symbol}:{tokenPairs.data.data[6].tokenA.address}
          <br></br>
          {tokenPairs.data.data[6].tokenB.symbol}:{tokenPairs.data.data[6].tokenB.address}
          
          
        </div>
      )
    })
  
  /*  const { body: markets } = await axis(BASE_URL + '/markets', {
  
      json: true
  
    })
    // Print all the markets
  
    console.log(`Found ${markets.length} markets in DutchX:`)
    markets.forEach((market, index) => {    
  
      console.log(`[${index + 1}] ${market.tokenA.symbol}-${market.tokenB.symbol}:`)
      printTokenInfo(market.tokenA)
      printTokenInfo(market.tokenB)
  
    })
  */
    // For more operations go to the API docs: 
    //    https://dx-services.dev.gnosisdev.com/docs/api/
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
 
          <button onClick={ this.getInfoFromDx }>getRunningTokenPairs</button>
            
          <button onClick={ this.deposit }>Deposit</button>
          <button onClick={ this.getBalances }>Get balances</button>
          <button onClick={ this.setAllowance }>setAllowance</button>
          <button onClick={ this.wrapEther }>Wrap Ether</button>
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