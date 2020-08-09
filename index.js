var tableBuilder = {

  minWidthForColumn: 150,

  minXDefault: 1,

  maxXDefault: 1,

  minYDefault: 1,

  maxYDefault: 12,

  minX: 0,

  maxX: 0,

  minY: 0,

  maxY: 0,

  restart: false,

  vw: 0,

  vh: 0,

  restartSVG: `
        <svg version="1.1" viewBox="0 0 178.2 186.08" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(-287.94 -456.48)" fill="none">
                <path transform="matrix(.46642 -.98449 1.0097 .47838 24.256 911.33)" d="m505.58 148.29a70.219 68.464 0 0 1-54.814 66.796 70.219 68.464 0 0 1-78.865-37.488 70.219 68.464 0 0 1 20.211-83.244 70.219 68.464 0 0 1 87.733 0.96318" stroke="#000" stroke-linecap="round" stroke-width="22.66"/>
                <path d="m377.05 468.98v75.785" stroke="#000002" stroke-linecap="square" stroke-width="25"/>
            </g>
        </svg>`,

  init: function (restart) {
    // console.log(restart);
    this.vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    this.vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    let addition = Math.floor(this.vw / this.minWidthForColumn)
    if (addition > 11) {
      addition = 11
    }
    this.maxXDefault = this.minXDefault + addition
    if (restart === true || this.minX === 0) {
      if (restart === true) {
        this.restart = true
      }
      this.minX = this.minXDefault
      this.minY = this.minYDefault
      this.maxX = this.maxXDefault
      this.maxY = this.maxYDefault
    }
    let html = ''
    html += this.getTableStart()
    for (let y = 0; y <= this.maxY; y++) {
      if (y > 0 && y < this.minY) {
        continue
      }
      html += this.getRowStart()
      for (let x = 0; x <= this.maxX; x++) {
        if (x > 0 && x < this.minX) {
          continue
        }
        html += this.getCell(x, y)
      }
      html += this.getRowEnd()
    }
    html += this.getTableEnd()
    document.getElementById('table-holder').innerHTML = html

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
      return '' +
                '<th class="restart">' +
                    '<a href="#" ' +
                        'onclick="if(window.confirm(\'Delete all your answers and start again?\') === true) {tableBuilder.init(true);}">' +
                        this.restartSVG +
                    '</a> ' +

                '</th>'
    } else if (x === 0) {
      return this.getRowHeader(y)
    } else if (y === 0) {
      return this.getColumnHeader(x)
    } else {
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
                        'onkeyup="tableBuilder.test(event,this,' + x + ', ' + y + ', false);" ' +
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

  test: function (event, el, x, y, testGrid) {
    const test = x * y
    const answer = parseInt(el.value)
    if (!answer || isNaN(answer)) {
      el.classList.remove('good')
      el.classList.remove('bad')
    } else {
      const newGoodAnswer = !el.classList.contains('good')
      if (answer === test) {
        el.classList.add('good')
        el.classList.remove('bad')
        this.myCookie.setCookie(el.id, answer)
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
        el.classList.remove('good')
        el.classList.add('bad')
      }
    }
    if (event.code == "Enter") {
      const newTabIndex = this.getNextTabIndex(x, y)
      if (newTabIndex) {
        newTabIndex.focus()
      }
    }
  },

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

  zeroFill: function (number, width) {
    width -= number.toString().length
    if (width > 0) {
      return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number
    }
    return number + '' // always return a string
  },

  myCookie: {

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
    }
  },

  getTabIndex: function (x, y) {
    return (10000000 * x) + y
  },

  getNextTabIndex: function (x, y) {
    if (y === this.maxY) {
      x++
      y = this.minY
    } else {
      y++
    }
    const getNextTabIndexValue = this.getTabIndex(x, y)
    const selector = 'input[tabindex=\'' + getNextTabIndexValue + '\']'
    // console.log(selector);
    // console.log(document.querySelector(selector));
    if (document.querySelector(selector)) {
      return document.querySelector(selector)
    } else {
      // console.log('not found!');
    }
  }

}

tableBuilder.init()
