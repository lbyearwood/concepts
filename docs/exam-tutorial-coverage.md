# Exam tutorial coverage

Verified 21 November 2026. This is the current coverage register for the 22 existing Exam questions. Level 1/2/3, course resources and concept models are outside this rollout.

All 111 original stages, question requirements, examples and complete solutions are retained. Guides cover 167 physical Python lines, including four blank separators, with 88 current-line understanding questions and 42 selected prediction checkpoints. Every guide has its own line-specific explanation and Remember guidance.

The original string-search guide keeps its approved sequence. The other 21 include original stage reviews, including test-only/extension stages. Temporary pass and diagnostic-print fragments are labelled practice examples; they do not become extra lines in the cumulative program. Explicit line-to-stage mapping preserves the exact finished solution.

Local Edge completed all 22 actual tutorial flows: 404 learning views and all 130 checkpoints, with correct final code, all original stages, wrong-answer/forward-stage locks, question-first defaults and Close-only End. All 104 Node and 33 Python tests pass. The independent algorithm cases below cover normal, absent/duplicate, boundary, empty-file and preservation behavior as appropriate; function reuse adds separate boundary/empty-list checks.

| ID | Tutorial | Original stages | Code lines | Understanding | Predictions after line | Algorithm cases | Local Edge full flow |
| --- | --- | ---: | ---: | ---: | --- | ---: | --- |
| problem-1 | Linear search on a string | 4 | 10 | 5 | 2, 5 | 3 | Pass |
| problem-2 | Linear search on a list | 5 | 5 | 4 | 2, 4 | 2 | Pass |
| problem-3 | For each loop | 3 | 3 | 3 | 1 | 1 | Pass |
| problem-4 | For in range loop | 4 | 4 | 3 | 2 | 1 | Pass |
| problem-5 | Append | 5 | 5 | 4 | 1, 3 | 1 | Pass |
| problem-6 | Empty position | 6 | 6 | 4 | 3, 5 | 1 | Pass |
| problem-7 | Two Conditions | 6 | 6 | 3 | 3, 5 | 1 | Pass |
| problem-8 | Print the index number | 5 | 5 | 4 | 2, 4 | 2 | Pass |
| problem-9 | Count a letter | 5 | 7 | 4 | 3, 6 | 4 | Pass |
| problem-10 | Count even or odd | 6 | 9 | 4 | 3, 8 | 1 | Pass |
| problem-11 | Count threshold | 6 | 10 | 4 | 4, 9 | 1 | Pass |
| problem-12 | Count a range | 6 | 8 | 4 | 4, 7 | 1 | Pass |
| problem-13 | Process String | 5 | 11 | 4 | 2, 5 | 4 | Pass |
| problem-14 | Calculate a ticket price | 5 | 10 | 4 | 5, 8 | 3 | Pass |
| problem-15 | Validate a score | 5 | 8 | 4 | 2, 4 | 3 | Pass |
| problem-16 | Calculate a quiz total | 5 | 9 | 4 | 2, 4 | 1 | Pass |
| problem-17 | Find items to restock | 5 | 10 | 5 | 2, 5 | 1 | Pass |
| problem-18 | Display a text file | 5 | 6 | 5 | 2, 4 | 4 | Pass |
| problem-19 | Append a club member | 5 | 5 | 3 | 1, 3 | 2 | Pass |
| problem-20 | Write a results file | 5 | 9 | 4 | 2, 7 | 1 | Pass |
| problem-21 | Count high readings | 5 | 8 | 4 | 2, 6 | 3 | Pass |
| problem-22 | Copy group bookings | 5 | 13 | 5 | 7, 10 | 4 | Pass |

## Exact line mapping and solution identity

Stage numbers below are one-based; each position in a mapping corresponds to one physical line in the canonical solution. Blank lines remain present. No-code test stages remain available as stage reviews. SHA-256 is over the exact UTF-8 solution string, without adding a final newline.

- **problem-1 — Linear search on a string**. Mapping `1,2,3,3,3,3,4,4,4,4`. SHA-256 `100d43e705d380952f06a96188d3df79ad538e18950010426fb2074657745162`.
- **problem-2 — Linear search on a list**. Mapping `1,2,3,4,5`. SHA-256 `060eb49cbf392b0cea64198cd92d02998a9c5e60bec62f406f628edb4eba857b`.
- **problem-3 — For each loop**. Mapping `1,2,3`. SHA-256 `9b44c8a3b99bbf1cc3682bf1c43fef03f1242f3fbb12cc287563755b841a443d`.
- **problem-4 — For in range loop**. Mapping `1,2,3,4`. SHA-256 `0b2a166060ea3c73a7c8446eda735ba8a095e3f4c17545712e07cc548c8d653f`.
- **problem-5 — Append**. Mapping `1,2,3,4,5`. SHA-256 `a6ff6a77eb5c5e3527512f47acb2025c697e33cba47e8e79688514ad33c6a6f7`.
- **problem-6 — Empty position**. Mapping `1,2,3,4,5,6`. SHA-256 `638b5c1a24fc56cc9ae00ac2dbdbbdcb3faa6217b29c910c06bbc46e888fb2fe`.
- **problem-7 — Two Conditions**. Mapping `1,2,3,4,5,6`. SHA-256 `49bd2644387689186ae6bc05d43036abbbea3030623887537ac7a06299f506a7`.
- **problem-8 — Print the index number**. Mapping `1,2,3,4,5`. SHA-256 `a05560de61396c963e5d984cea36bd558182c0c4721f049fac192f0e6326f614`.
- **problem-9 — Count a letter**. Mapping `1,1,2,3,3,3,4`. SHA-256 `c1f417b5be7706b567de3833f9b969a737df1c53ba5d51053498ef00946b2fc1`.
- **problem-10 — Count even or odd**. Mapping `1,2,3,4,5,5,5,5,6`. SHA-256 `36a95483e9f0becc5d508c05638c8d3645aca0ec0ce7fe1f4cb7ce296e6072a9`.
- **problem-11 — Count threshold**. Mapping `1,2,3,3,4,5,5,5,5,6`. SHA-256 `a654695a2e1241c8a9b227943ae2382a34bc5abfef313d7c7ff9cc2990f85816`.
- **problem-12 — Count a range**. Mapping `1,2,2,3,4,5,5,6`. SHA-256 `172265f4d695e67d0adcba53976eacb9a9a4cc2bf590dc22231fe064ff71e5fb`.
- **problem-13 — Process String**. Mapping `1,1,2,3,3,4,4,4,4,4,5`. SHA-256 `bf101cd61af6066ecac62988e4877e07f1ef8378d9037e024ac99475081cdc1a`.
- **problem-14 — Calculate a ticket price**. Mapping `1,2,2,2,2,3,3,4,5,5`. SHA-256 `90e52269a1ca44f7f101df4cc51495262aee276246e60ae39b57c38070076432`.
- **problem-15 — Validate a score**. Mapping `1,2,2,3,4,4,4,5`. SHA-256 `670fcb80daf77c7c5765f12d47fdcc8365cbfe2cb6ce9583116d603f7c79a333`.
- **problem-16 — Calculate a quiz total**. Mapping `1,2,3,3,4,4,5,5,5`. SHA-256 `c2eac75e6afb81f517e6083b0de2dfa745285089f24d0424f9f181dc5e81b6ba`.
- **problem-17 — Find items to restock**. Mapping `1,2,3,3,3,4,4,5,5,5`. SHA-256 `102e8c4798efd855225305d2198612448041c224750060151d2c8a1f53c04415`.
- **problem-18 — Display a text file**. Mapping `1,2,3,3,3,4`. SHA-256 `4d31599e708a33dfd8acc91896cbdcee30428f9e5e7f0ffb1dcac4e82238b0f5`.
- **problem-19 — Append a club member**. Mapping `1,2,3,4,4`. SHA-256 `1a9a324a99e732af72374f8ea8f9d145553d94db4e1f44c39e47ef385f5e10ed`.
- **problem-20 — Write a results file**. Mapping `1,1,2,3,3,3,3,4,5`. SHA-256 `546905de74a8178cec0eeca3a09da5def07c6c248dda092020ce682da0e7d058`.
- **problem-21 — Count high readings**. Mapping `1,1,2,2,3,3,4,4`. SHA-256 `e9f90e314686bcd332068d1dcba8abb2b7771658d417a6f3d06cdcebbf17a92b`.
- **problem-22 — Copy group bookings**. Mapping `1,1,1,2,2,2,2,3,3,3,4,4,4`. SHA-256 `74bb68898659bd72e6966d76de2becf1184e19d1d8c5eb2ea5b0cf508c05ad9f`.

## Rendered coverage and limits

Desktop Edge at 1400×626 exercised every learning view in all 22 tutorials. Complete compact flows were checked for Find items to restock at 320×740, Count a letter at 320×740 and Copy group bookings at 844×390, including fitted code/explanation/answer/stage-review pages. These three flows cover 95 distinct compact views. Controls and content fit without internal overflow in the checked states. Natural typing completion was awaited before paging earlier code, since typing intentionally keeps the current line visible.

Original generated keyboard clicks and the selected correct/wrong recordings were exercised in a new file-handling tutorial. Escape and an inert sidebar/home click retained its current answer/URL; Back restored a correct choice silently. Automated tests cover all checkpoint IDs and attempt resets. Browser checks use real controls and read-only DOM observations, without application-state injection.

Other browsers, a full screen-reader audit and measured classroom learning outcomes are outside this validation. This file describes source/local coverage; the exact production revision, successful Pages run and live interactions are recorded in the project release QA.

Sources: [catalogue](../data/programming-problems.json), [guides](../data/tutorial-guides.json), [frame/gate tests](../tests/tutorial-rollout.test.cjs), [answer/state tests](../tests/tutorial-tutor.test.cjs), [algorithm cases](../tests/test_programming_algorithms.py).
