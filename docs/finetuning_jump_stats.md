For the finetuning, the key levers are in precision.ts:

  AIR_BRAKE_TAP_REDUCTION = 0.95    // Currently 5% - could try 7-8%
  AIR_BRAKE_HOLD_REDUCTION = 0.97   // Currently 3%/frame
  SLIDE_EXTEND_VELOCITY = 0.15      // The "push" amount
  SLIDE_BRAKE_FRICTION_MULT = 2.5   // Higher = more stopping power

  And stamina costs:
  AIR_BRAKE_TAP_BASE_COST = 5
  AIR_BRAKE_HOLD_COST_PER_SEC = 15
  SLIDE_EXTEND_BASE_COST = 8
  SLIDE_BRAKE_COST_PER_SEC = 10
