// =============================================================================
//                                  Config
// =============================================================================
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
var defaultAccount;

// Constant we use later
var GENESIS =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// This is the ABI for your contract (get it from Remix, in the 'Compile' tab)
// ============================================================
var abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "input",
        type: "address",
      },
    ],
    name: "getAllOwingData",
    outputs: [
      {
        components: [
          {
            internalType: "uint32",
            name: "amount",
            type: "uint32",
          },
          {
            internalType: "address",
            name: "owingAddress",
            type: "address",
          },
        ],
        internalType: "struct Splitwise.Owing[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getParticipant",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "iAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "uAddress",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "amount",
        type: "uint32",
      },
    ],
    name: "iou",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "debtor",
        type: "address",
      },
      {
        internalType: "address",
        name: "creditor",
        type: "address",
      },
    ],
    name: "lookup",
    outputs: [
      {
        internalType: "uint32",
        name: "ret",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "participant",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "participantList",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]; // FIXME: fill this in with your contract's ABI //Be sure to only have one array, not two
// ============================================================
abiDecoder.addABI(abi);
// call abiDecoder.decodeMethod to use this - see 'getAllFunctionCalls' for more

var contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // FIXME: fill this in with your contract's address/hash

var BlockchainSplitwise = new ethers.Contract(
  contractAddress,
  abi,
  provider.getSigner()
);

var cycle_path = [];

// =============================================================================
//                            Functions To Implement
// =============================================================================

// Add any helper functions here!
async function owingDataAdapter(user) {
  const result = await BlockchainSplitwise.getAllOwingData(user);

  let newResult = [];
  for (let i = 0; i < result.length; i++) {
    newResult.push(result[i].owingAddress);
  }
  return newResult;
}

async function findTheLestAmount(path) {
  let amount = 0;

  for (let i = 1; i < path.length; i++) {
    const result = await BlockchainSplitwise.getAllOwingData(path[i - 1]);

    for (let j = 0; j < result.length; j++) {
      console.log(
        "Result: ",
        result[j].owingAddress,
        " Focused Path: ",
        path[i]
      );
      if (result[j].owingAddress == path[i]) {
        cycle_path.push({
          account: path[i - 1],
          own_account: result[j].owingAddress,
          amount: result[j].amount,
        });
        if (i == 1 || result[j].amount < amount) {
          console.log(result[j], typeof result[j].amount);
          amount = result[j].amount;
        }
      }
    }
  }

  return amount;
}

// Return a list of all users (creditors or debtors) in the system
// All users in the system are everyone who has ever sent or received an IOU
async function getUsers() {
  const participantResult = await BlockchainSplitwise.getParticipant();
  return participantResult;
}

// Get the total amount owed by the user specified by 'user'
async function getTotalOwed(user) {
  const result = await BlockchainSplitwise.getAllOwingData(user);

  let totalOwed = 0;
  let ownedAccount = [];
  for (let i = 0; i < result.length; i++) {
    console.log(
      "Owing Address: ",
      result[i].owingAddress,
      " Amount: ",
      result[i].amount
    );
    totalOwed = totalOwed + result[i].amount;
    if (result[i].amount > 0) {
      ownedAccount.push({
        account: result[i].owingAddress,
        amount: result[i].amount,
      });
    }
  }
  return { total: totalOwed, accounts: ownedAccount };
}

// Get the last time this user has sent or received an IOU, in seconds since Jan. 1, 1970
// Return null if you can't find any activity for the user.
// HINT: Try looking at the way 'getAllFunctionCalls' is written. You can modify it if you'd like.
async function getLastActive(user) {
  const result = await getAllFunctionCalls(contractAddress, "iou");
  for (let i = 0; i < result.length; i++) {
    const focusedItem = result[i];
    if (focusedItem.from == user) {
      return new Date(focusedItem.t);
    }
  }
  return new Date(0);
}

// add an IOU ('I owe you') to the system
// The person you owe money is passed as 'creditor'
// The amount you owe them is passed as 'amount'
async function add_IOU(creditor, amount) {
  var BlockchainSplitwise = new ethers.Contract(
    contractAddress,
    abi,
    provider.getSigner(defaultAccount)
  );

  await BlockchainSplitwise.iou(defaultAccount, creditor, amount);

  // Do the BFS to find the cycle.
  const cyclePath = await doBFS(
    defaultAccount,
    defaultAccount,
    owingDataAdapter
  );
  if (!cyclePath) {
    console.log("No cycle path");
    return;
  }
  console.log("Cycle Path: ", cyclePath);
  const leastAmount = await findTheLestAmount(cyclePath);
  console.log("Least Amount: ", leastAmount);

  // Send iou transaction to clearout the cycle path;
  for (let i = 1; i < cyclePath.length; i++) {
    console.log(
      "I: ",
      cyclePath[i],
      " OU: ",
      cyclePath[i - 1],
      " Amount: ",
      leastAmount
    );
    await BlockchainSplitwise.iou(cyclePath[i], cyclePath[i - 1], leastAmount);
  }
}

// =============================================================================
//                              Provided Functions
// =============================================================================
// Reading and understanding these should help you implement the above

// This searches the block history for all calls to 'functionName' (string) on the 'addressOfContract' (string) contract
// It returns an array of objects, one for each call, containing the sender ('from'), arguments ('args'), and the timestamp ('t')
async function getAllFunctionCalls(addressOfContract, functionName) {
  var curBlock = await provider.getBlockNumber();
  var function_calls = [];

  while (curBlock !== GENESIS) {
    var b = await provider.getBlockWithTransactions(curBlock);
    var txns = b.transactions;
    for (var j = 0; j < txns.length; j++) {
      var txn = txns[j];
      // check that destination of txn is our contract
      if (txn.to == null) {
        continue;
      }

      if (txn.to.localeCompare(addressOfContract)) {
        var func_call = abiDecoder.decodeMethod(txn.data);

        // check that the function getting called in this txn is 'functionName'
        if (func_call && func_call.name === functionName) {
          var timeBlock = await provider.getBlock(curBlock);
          var args = func_call.params.map(function (x) {
            return x.value;
          });
          function_calls.push({
            from: txn.from,
            args: args,
            t: timeBlock.timestamp,
          });
        }
      }
    }
    curBlock = b.parentHash;
  }
  return function_calls;
}

// We've provided a breadth-first search implementation for you, if that's useful
// It will find a path from start to end (or return null if none exists)
// You just need to pass in a function ('getNeighbors') that takes a node (string) and returns its neighbors (as an array)
async function doBFS(start, end, getNeighbors) {
  var queue = [[start]];
  let isFirstRound = true;
  while (queue.length > 0) {
    var cur = queue.shift();
    var lastNode = cur[cur.length - 1];
    if (lastNode === end.toString() && !isFirstRound) {
      return cur;
    } else {
      var neighbors = await getNeighbors(lastNode);
      for (var i = 0; i < neighbors.length; i++) {
        queue.push(cur.concat([neighbors[i]]));
      }
    }
    isFirstRound = false;
  }
  return null;
}

// =============================================================================
//                                      UI
// =============================================================================

// This sets the default account on load and displays the total owed to that
// account.
provider.listAccounts().then((response) => {
  defaultAccount = response[0];

  getTotalOwed(defaultAccount).then((response) => {
    $("#total_owed").html("$" + response.total);
    $("num_owned_account").html(response.accounts.length);
    if (response.accounts.length > 0) {
      $("#owned_account").html(
        response.accounts.map(function (u, i) {
          return (
            "<li>" + u.account + "-" + "<b>" + "$" + u.amount + "</b>" + "</li>"
          );
        })
      );
    }
    if (response.accounts.length <= 0) {
      $("#owned_account").html(
        response.accounts.map(function (u, i) {
          return "<li>" + "hu" + "</li>";
        })
      );
    }
  });

  getLastActive(defaultAccount).then((response) => {
    time = timeConverter(response);
    $("#last_active").html(time);
  });
});

// This code updates the 'My Account' UI with the results of your functions
$("#myaccount").change(function () {
  defaultAccount = $(this).val();

  getTotalOwed(defaultAccount).then((response) => {
    $("#total_owed").html("$" + response.total);
    console.log(response.accounts.length);
    $("num_owned_account").html("" + response.accounts.length);
    if (response.accounts.length > 0) {
      $("#owned_account").html(
        response.accounts.map(function (u, i) {
          return (
            "<li>" + u.account + "-" + "<b>" + "$" + u.amount + "</b>" + "</li>"
          );
        })
      );
    }
    if (response.accounts.length <= 0) {
      $("#owned_account").html(
        response.accounts.map(function (u, i) {
          return "<li>" + "hu" + "</li>";
        })
      );
    }
  });

  getLastActive(defaultAccount).then((response) => {
    time = timeConverter(response);
    $("#last_active").html(time);
  });
});

// Allows switching between accounts in 'My Account' and the 'fast-copy' in 'Address of person you owe
provider.listAccounts().then((response) => {
  var opts = response.map(function (a) {
    return '<option value="' + a + '">' + a + "</option>";
  });
  $(".account").html(opts);
  $(".wallet_addresses").html(
    response.map(function (a) {
      return "<li>" + a + "</li>";
    })
  );
});

// This code updates the 'Users' list in the UI with the results of your function
getUsers().then((response) => {
  $("#all_users").html(
    response.map(function (u, i) {
      return "<li>" + u + "</li>";
    })
  );
});

// This runs the 'add_IOU' function when you click the button
// It passes the values from the two inputs above
$("#addiou").click(function () {
  defaultAccount = $("#myaccount").val(); //sets the default account
  add_IOU($("#creditor").val(), $("#amount").val())
    .then((response) => {
      console.log(cycle_path);
      var message = "";
      for (let i = 0; i < cycle_path.length; i++) {
        message += `${cycle_path[i].account} -> ${cycle_path[i].own_account}: ${cycle_path[i].amount}\n`;
      }
      alert(message);
      window.location.reload(false); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
    .catch((err) => {
      alert(err.error.data.message.split("'")[1]);
    });
});

// This is a log function, provided if you want to display things to the page instead of the JavaScript console
// Pass in a discription of what you're printing, and then the object to print
function log(description, obj) {
  $("#log").html(
    $("#log").html() +
      description +
      ": " +
      JSON.stringify(obj, null, 2) +
      "\n\n"
  );
}

// =============================================================================
//                                      TESTING
// =============================================================================

// This section contains a sanity check test that you can use to ensure your code
// works. We will be testing your code this way, so make sure you at least pass
// the given test. You are encouraged to write more tests!

// Remember: the tests will assume that each of the four client functions are
// async functions and thus will return a promise. Make sure you understand what this means.

function check(name, condition) {
  if (condition) {
    console.log(name + ": SUCCESS");
    return 3;
  } else {
    console.log(name + ": FAILED");
    return 0;
  }
}

async function sanityCheck() {
  console.log(
    "\nTEST",
    "Simplest possible test: only runs one add_IOU; uses all client functions: lookup, getTotalOwed, getUsers, getLastActive"
  );

  var score = 0;

  var accounts = await provider.listAccounts();
  defaultAccount = accounts[0];

  var users = await getUsers();
  console.log("User", users);
  score += check("getUsers() initially empty", users.length === 0);

  var owed = await getTotalOwed(accounts[1]);
  score += check("getTotalOwed(0) initially empty", owed === 0);

  var lookup_0_1 = await BlockchainSplitwise.lookup(accounts[0], accounts[1]);
  console.log("lookup(0, 1) current value" + lookup_0_1);
  score += check("lookup(0,1) initially 0", parseInt(lookup_0_1, 10) === 0);

  var response = await add_IOU(accounts[1], "10");

  users = await getUsers();
  score += check("getUsers() now length 2", users.length === 2);

  owed = await getTotalOwed(accounts[0]);
  score += check("getTotalOwed(0) now 10", owed === 10);

  lookup_0_1 = await BlockchainSplitwise.lookup(accounts[0], accounts[1]);
  score += check("lookup(0,1) now 10", parseInt(lookup_0_1, 10) === 10);

  var timeLastActive = await getLastActive(accounts[0]);
  var timeNow = Date.now() / 1000;
  var difference = timeNow - timeLastActive;
  score += check(
    "getLastActive(0) works",
    difference <= 60 && difference >= -3
  ); // -3 to 60 seconds

  console.log("Final Score: " + score + "/21");
}

//sanityCheck(); //Uncomment this line to run the sanity check when you first open index.html
