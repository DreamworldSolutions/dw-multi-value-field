/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { css } from 'lit-element';

// These are the dw element needed by this element.
import  { DwMultiValueField } from '../dw-multi-value-field.js';

// These are the dw styles needed by this element.
import { flexLayout } from '@dreamworld/flex-layout/flex-layout.js';
import { alignment } from '@dreamworld/flex-layout/flex-layout-alignment.js';

export class DwMultiValueFieldDemo extends DwMultiValueField {
  static get styles() {
    return [
      super.styles,
      flexLayout,
      alignment,
      css `
      `
    ];
  }
}

window.customElements.define('dw-multi-value-field-demo', DwMultiValueFieldDemo);
