import {useState } from 'react'
import { HexColorPicker } from "react-colorful"
import { compile, parse } from 'mathjs'
import assert from 'assert'

import { ContextWrapper } from '@/lib/plot'
import funGraph from '@/lib/funGraph'
import levelPlot from '@/lib/levels'
import { get, set, getField, update, map, extract, onChange, State, SetState } from '@/lib/State'
import Coords from '@/lib/Coords'
import Canvas from '@/components/Canvas'

