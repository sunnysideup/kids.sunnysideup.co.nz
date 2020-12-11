if ('serviceWorker' in navigator) {
  // register service worker
  navigator.serviceWorker.register('service-worker.js')
}

const tableBuilder = {

  /**
   * minimum width in pixels for each column.
   * @type {number}
   */
  minWidthForColumn: 150,

  /**
   * default max number of columns
   * @type {number}
   */
  maxNumberOfColumnsEver: 12,

  /**
   * default minimum number of columns
   * @type {number}
   */
  minXDefault: 1,

  /**
   * default max number of columns
   * @type {number}
   */
  maxXDefault: 12,

  /**
   * default min number of row
   * @type {number}
   */
  minYDefault: 1,

  /**
   * default max number of rows
   * @type {Integer}
   */
  maxYDefault: 12,

  /**
   * calculated minimum number of columns
   * @type {number}
   */
  minX: 0,

  /**
   * calculated max number of columns
   * @type {number}
   */
  maxX: 0,

  /**
   * calculated minimum number of rows
   * @type {number}
   */
  minY: 0,

  /**
   * calculated maximum number of columns
   * @type {number}
   */
  maxY: 0,

  /**
   * is it a restart
   * @type {boolean}
   */
  restart: false,

  /**
   * viewport width
   * @type {number}
   */
  vw: 0,

  /**
   * viewport height
   * @type {number}
   */
  vh: 0,

  /**
   * reset SVG
   * @type {string}
   */
  restartSVG: `
        <svg version="1.1" viewBox="0 0 178.2 186.08" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(-287.94 -456.48)" fill="none">
                <path transform="matrix(.46642 -.98449 1.0097 .47838 24.256 911.33)" d="m505.58 148.29a70.219 68.464 0 0 1-54.814 66.796 70.219 68.464 0 0 1-78.865-37.488 70.219 68.464 0 0 1 20.211-83.244 70.219 68.464 0 0 1 87.733 0.96318" stroke="#000" stroke-linecap="round" stroke-width="22.66"/>
                <path d="m377.05 468.98v75.785" stroke="#000002" stroke-linecap="square" stroke-width="25"/>
            </g>
        </svg>`,

  init: function (restart) {
    // lets set the viewport: https://stackoverflow.com/questions/1248081/how-to-get-the-browser-viewport-dimensions
    this.vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    this.vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

    // work out the number of columns to add
    let additionalColumns = Math.floor(this.vw / this.minWidthForColumn)
    const maxColumns = this.maxNumberOfColumnsEver - 1
    if (additionalColumns > maxColumns) {
      additionalColumns = maxColumns
    }

    // reset min and mix
    this.maxXDefault = this.minXDefault + additionalColumns
    if (restart === true || this.minX === 0) {
      if (restart === true) {
        this.restart = true
      }
      this.minX = this.minXDefault
      this.minY = this.minYDefault
      this.maxX = this.maxXDefault
      this.maxY = this.maxYDefault
    }

    //  start building HTML
    let html = ''
    html += this.getTableStart()
    for (let y = 0; y <= this.maxY; y++) {
      // if minY has not been reached yet, do the next loop
      if (y > 0 && y < this.minY) {
        continue
      }

      // start a row
      html += this.getRowStart()
      for (let x = 0; x <= this.maxX; x++) {
        // if minX has not been reached yet, do the next loop
        if (x > 0 && x < this.minX) {
          continue
        }
        // build the cell
        html += this.getCell(x, y)
      }
      html += this.getRowEnd()
    }
    html += this.getTableEnd()
    document.getElementById('table-holder').innerHTML = html
    this.setFirstThreeAnswers();
  },

  getTableStart: function () { return '<table><tbody>' },

  getTableEnd: function () { return '</tbody></table>' },

  getRowStart: function () { return '<tr>' },

  getRowEnd: function () { return '</tr>' },

  getRowHeader: function (y) {
    return '<th scope="row" class="y-' + y + ' good">' + y + '</th>'
  },

  getColumnHeader: function (x) {
    return '<th scope="col" class="x-' + x + ' good">' + x + '</th>'
  },

  getCell: function (x, y) {
    if (x === 0 && y === 0) {
      // HEADER-HEADER: this is the upper-left cell - the reset cell!
      return '' +
                '<th class="restart"> </th>' +'<div clas="reset">' +
                    '<a href="#" ' +
                        'onclick="if(window.confirm(\'Delete all your answers and start again?\') === true) {tableBuilder.init(true);}">' +
                        this.restartSVG +
                    '</a> ' +

                '</div>'
    } else if (x === 0) {
      // HEADER: get a new row (tr)
      return this.getRowHeader(y)
    } else if (y === 0) {
      // HEADER: get a new column
      return this.getColumnHeader(x)
    } else {
      // real cell!
      const classX = 'x-' + x
      const classY = 'y-' + y
      const tabIndex = this.getTabIndex(x, y)
      const id = 'input-' + x + 'x' + y
      const value = this.getValue(id)
      let classA = ''
      if (value && value !== null) {
        classA = 'good'
      }
      return '' +
                '<td class="' + classX + ' ' + classY + '" >' +
                    '<input ' +
                        'type="number"' +
                        'id="' + id + '" ' +
                        'data-answer="' + (x * y) + '" ' +
                        'placeholder="' + x + '×' + y + '" ' +
                        'onkeydown="tableBuilder.test(event,this,' + x + ', ' + y + ', false);" ' +
                        'onblur="tableBuilder.test(this,' + x + ', ' + y + ', false);" ' +
                        'onchange="tableBuilder.test(this,' + x + ', ' + y + ', true);" ' +
                        'pattern="[0-9]" ' +
                        'tabindex="' + tabIndex + '" ' +
                        'value="' + value + '" ' +
                        'class="' + classA + '" ' +
                    '/>' +
                '</td>'
    }
  },

  getValue (id) {
    let value = ''
    if (this.restart) {
      this.myCookie.eraseCookie(id)
      value = ''
    } else {
      value = this.myCookie.getCookie(id)
      if (value === null) {
        value = ''
      }
    }

    return value
  },

  /**
   * test if the entered value is correct?
   * @param  {object} event - what event caused the test?
   * @param  {object} el - element being tested
   * @param  {number} x - the value for x
   * @param  {number} y - the value for y
   * @param  {boolean} testGrid - ????
   */
  test: function (event, el, x, y, testGrid) {
    // what is the answer
    const test = x * y
    const answer = parseInt(el.value)
    if (!answer || isNaN(answer)) {
      // no answer!
      this.makeNothing(el)
    } else {
      // test answer ...
      const newGoodAnswer = !el.classList.contains('good')
      if (answer === test) {
        // right answer
        this.makeGood(el)
        // save cookie
        this.myCookie.setCookie(el.id, answer)

        // find next answer!
        if (newGoodAnswer) {
          const newTabIndex = this.getNextTabIndex(x, y)
          if (newTabIndex) {
            newTabIndex.focus()
          }
        }
        // if(y === this.maxY && testGrid) {
        //     this.levelUp(x);
        // }
      } else {
        // bad answer!
        this.makeBad(el)
      }
    }
    this.keyPressed(event, x, y)
  },

  makeNothing: function (el) {
    if (typeof el.classList !== 'undefined') {
      el.classList.remove('bad')
      el.classList.remove('good')
      el.classList.add('nothing')
    }
  },

  /**
   * bad answer
   */
  makeGood: function (el) {
    if (typeof el.classList !== 'undefined') {
      el.classList.remove('bad')
      el.classList.add('good')
    }
  },

  /**
   * good answer
   */
  makeBad: function (el) {
    if (typeof el.classList !== 'undefined') {
      el.classList.remove('good')
      el.classList.add('bad')
    }
  },

  /**
   * action key being pressed
   * @param  {object} event
   * @param  {number} x
   * @param  {number} y
   */
  keyPressed: function (event, x, y) {
    let newTabIndex
    switch (event.code) {
      case 'Enter':
        newTabIndex = this.getNextTabIndex(x, y)
        if (newTabIndex) {
          newTabIndex.focus()
        }
        break
      case 'ArrowLeft':
        newTabIndex = this.getLeftTabIndex(x, y)
        if (newTabIndex) {
          newTabIndex.focus()
        }
        break
      case 'ArrowRight':
        newTabIndex = this.getRightTabIndex(x, y)
        if (newTabIndex) {
          newTabIndex.focus()
        }
        break

     
      case "ArrowUp":
        newTabIndex = this.getPrevTabIndex(x, y)
        if (newTabIndex) {
          event.preventDefault()
          newTabIndex.focus()
        }
        break
      case "ArrowDown":
        newTabIndex = this.getNextTabIndex(x, y)
        if (newTabIndex) {
          event.preventDefault()
          newTabIndex.focus()
        }
        break
      
    }
  },

  /**
   * task completed!
   * returns true if task is completed.
   * @param  {number} x
   * @return {boolean}
   */
  levelUp: function (x) {
    const selector = 'x-' + x
    const cells = document.getElementsByClassName(selector)
    let i = 0
    for (i = 0; i < cells.length; i++) {
      const cell = cells[i]
      if (cell.tagName.toLowerCase() === 'td') {
        if (!cell.childNodes[0].classList.contains('good')) {
          return false
        }
      }
    }
    this.minX++
    this.maxX++
    this.init()

    return true
  },

  setFirstThreeAnswers: function () {
    this.myCookie.eraseAllCookie();
    const x = 1
    let y = 1
    let answer = null
    let input = null
    for (y = 1; y < 4; y++) {
      input = this.getTabByXY(x, y)
      answer = x * y
      input.value = answer;
      this.makeGood(input);
    }
  },

  //
  // zeroFill: function (number, width) {
  //   width -= number.toString().length
  //   if (width > 0) {
  //     return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number
  //   }
  //   return number + '' // always return a string
  // },

  /**
   * cookie management
   * @type {Object}
   */
  myCookie: {

    /**
     * set a cookie value
     * @param  {string} name
     * @param  {mixed} value
     * @param  {number} days  how long to keep it ?
     */
    setCookie: function (name, value, days) {
      let expires = ''
      if (typeof days === 'undefined') {
        days = 14
      }
      if (days) {
        var date = new Date()
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
        expires = '; expires=' + date.toUTCString()
      }
      // console.log('set cookie: '+name+'='+value);
      document.cookie = name + '=' + (value || '') + expires + '; path=/'
    },

    /**
     * get cookie value
     * @param  {string} name
     * @return {mixed}
     */
    getCookie: function (name) {
      const nameEQ = name + '='
      const ca = document.cookie.split(';')
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === ' ') {
          c = c.substring(1, c.length)
        }
        if (c.indexOf(nameEQ) === 0) {
          const value = c.substring(nameEQ.length, c.length)
          // console.log('get cookie: '+name+'='+value);
          return value
        }
      }
      return null
    },

    eraseCookie: function (name) {
      // console.log('erase cookie: '+name);
      this.setCookie(name, null, 0)
    },
    eraseAllCookie: function(){
      const allCookies = document.cookie.split(';');
      for(let i = 0; i < allCookies.length; i++){
        var cookie = allCookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  },

  /**
   * get a unique number that always prioritises X over Y
   * e.g. if x is 3 and y is 7 then the number is 30000000007000
   * @param  {number} x
   * @param  {number} y
   * @return {number}
   */
  getTabIndex: function (x, y) {
    return (10000000 * x) + y
  },

  /**
   * find a cell by tab index
   * @param  {number} x
   * @param  {number} y
   * @return {object|null}
   */
  getTabByXY: function (x, y) {
    const getNextTabIndexValue = this.getTabIndex(x, y)
    const selector = 'input[tabindex=\'' + getNextTabIndexValue + '\']'
    // console.log(selector);
    // console.log(document.querySelector(selector));
    if (document.querySelector(selector)) {
      return document.querySelector(selector)
    }
  },

  getLeftTabIndex: function (x, y) {
    console.log(this.maxXDefault)
    if (x !== 1) {
      x--
    } else {
      x = this.maxXDefault
    }
    return this.getTabByXY(x, y)
  },

  getRightTabIndex: function (x, y) {
    if (x !== this.maxXDefault) {
      x++
    } else {
      x = 1
    }
    return this.getTabByXY(x, y)
  },

  getPrevTabIndex: function (x, y) {
    if (y === this.minY) {
      y = this.maxY
    } else {
      y--
    }
    return this.getTabByXY(x, y)
  },

  getNextTabIndex: function (x, y) {
    if (y === this.maxY) {
      x++
      y = this.minY
    } else {
      y++
    }
    return this.getTabByXY(x, y)
  }

}

tableBuilder.init()
