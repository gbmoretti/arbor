import { Arbor } from "@arborjs/store"

import { ShortCircuitApp } from "./models/ShortCircuitApp"

export const store = new Arbor(new ShortCircuitApp())
