
// BUDGET CONTROLLER - everything inside these anonymously invoked functions are private unless it is inside return method
var budgetController = (function() {

    // function constructor for expense
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    // function constructor for income
    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

      // our global data structure
    var data = {
        allItems: {
            exp: [],
            inc: []
        }, 
        totals : {
            exp: 0,
            inc: 0
        },
        budget: 0, 
        percentage: -1 // -1 is used if nothing exists at the moment

    };

    var calculateTotal = function(type) { // type is either income or expense 
        var sum = 0;
        data.allItems[type].forEach(function(cur) {
            sum += cur.value;
        });
        data.totals[type] = sum;
    };


    return {
        addItem: function(type, des, val) {
            var newItem, ID;

            // create new ID
            if (data.allItems[type].length > 0) {
                // ID = last ID (array.lenght - 1) in the array + 1 
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;   
            } else {
                ID = 0;
            }    

            // depending if we get inc or exp from input (- or +)
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }
            
            // push it into our data structure 
            data.allItems[type].push(newItem);

            // return the new element 
            return newItem;
        },

        calculateBudget: function() {

            // calculate total income and expenses 
            calculateTotal('exp');
            calculateTotal('inc');

            // calculate the budget: income - expenses 
            data.budget = data.totals.inc - data.totals.exp;

            // calculate the percentage of income that we spent 
            if(data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else{
                data.percentage = -1;
            }
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },
        // test the function in console to make sure its returning the proper data
        testing: function() {
            console.log(data);
        }

    };

})();


// UI CONTROLLER
var UIController = (function() {
    // to clean up code and avoid putting class name strings everywhere
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage'
    }

    return {
        getInput: function() {
            return {
                type: document.querySelector(DOMstrings.inputType).value, // Will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value) // parseFloat changes string to a floating number
            };
        },

        addListItem: function(obj, type) {
            var html, newHtml, element;
            // Create HTML string with placeholder text

            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="income-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            } else if (type === 'exp') {
                element = DOMstrings.expensesContainer;   
                html = '<div class="item clearfix" id="expense-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }


            // Replace the placeholder text with some actuall data 
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', obj.value);            

            // Insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml); //beforeend - insert as the last child of the list
        },
        
        clearFields: function() {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);    
            // trick javascript using slice method to think fields is an array using Array.prototype
            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function(current, index, array) {
                current.value = "";
            });
            // Put focus/pointer (using focus method) at the description input field as soon as its cleared
            fieldsArr[0].focus();

        },

        displayBudget: function(obj) {
            document.querySelector(DOMstrings.budgetLabel).textContent = obj.budget;
            document.querySelector(DOMstrings.incomeLabel).textContent = obj.totalInc;
            document.querySelector(DOMstrings.expensesLabel).textContent = obj.totalExp;
            document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage;
        },

        // expose private to public so others can access them
        getDOMstrings: function() {
            return DOMstrings;
        }
    };

})();


// GLOBAL APP CONTROLLER 
var controller = (function(budgetCtrl, UICtrl) {

    var setupEventListeners = function() {

        var DOM = UICtrl.getDOMstrings();        
        
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);
        
            document.addEventListener('keypress', function(event) {
                if (event.keyCode === 13 || event.which === 13) {
                    ctrlAddItem();
                }
            });
    }

    var updateBudget = function() {

        // 1. Calculate the budget
        budgetCtrl.calculateBudget();

        // 2. Return the budget
        var budget = budgetCtrl.getBudget();

        // 3. Display the bduget on the UI 
        UICtrl.displayBudget(budget);
    };

    var ctrlAddItem = function() {
        var input, newItem;
        
        // 1. Get the field input data
        input = UICtrl.getInput();
        
        // make sure descript values are NOT empty and input value is Not a NaN (not not a number/not empty) and input value is > 0
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {

            // 2. Add the item to the budget controller 
            newItem = budgetController.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI
            UICtrl.addListItem(newItem, input.type);

            // 4. Clear fields 
            UICtrl.clearFields();
            
            // 5. Calculate and update budget
            updateBudget();

        }
    };

    // so its available outside the private function 
    return {
        // As soon as application start run this:
        init: function() {
            console.log('Application has started.');
            setupEventListeners();
        }
    }

})(budgetController, UIController);

controller.init();







