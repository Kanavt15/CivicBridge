# CivicBridge local classifier

The AI lab at `/intelligence` offers two explicitly separate models: a public NYC311 municipal descriptor baseline and an authored English/Hindi demonstration. Both run locally in the Node server, without paid inference APIs or a GPU. Authenticated, rate-limited inference compares the learned model with the existing keyword-rule baseline and displays matched vocabulary, relative scores, and abstention.

## Public-data model

Multinomial Naive Bayes with Unicode word/bigram counts, Laplace smoothing, and empirical training priors. Vocabulary and counts are learned only from the training partition. The generated artifact includes the dataset SHA-256, upstream snapshot hash, retrieval timestamp, terms link, category coverage, and actual held-out evaluation. Training is deterministic; CI retrains and checks the artifact diff.

| Property                                   | Result                                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| Source                                     | NYC Open Data, NYC311, `erm2-nwe9`, calendar year 2025 |
| Input unit                                 | One cleaned structured English descriptor phrase       |
| Training / held-out examples               | 391 / 112                                              |
| Supported categories                       | 6                                                      |
| Top-ranked accuracy, including abstentions | 59.8%                                                  |
| Macro F1                                   | 0.503                                                  |
| Majority-class held-out baseline           | 40.2%                                                  |

The model abstained on 38 of 112 examples: coverage was 66.1%, with 75.7% accuracy among accepted predictions. The live card also shows per-category precision/recall/F1. These are descriptor-level metrics, not request-volume-weighted metrics. A prediction abstains when vocabulary coverage is below 15%, fewer than two known tokens occur, or the top-two relative-score margin is below 0.15. Thresholds were selected for the demonstrator, not calibrated on field data. Scores are normalized model scores, not reliable probabilities.

The source contains real municipal service data, but the inputs are short standardized descriptors, **not free-form citizen narratives**. Project-authored taxonomy mappings are not independently reviewed ground truth. The hash split prevents exact descriptor leakage; shared template language can remain. No held-out tuning or claimed Indian deployment accuracy is provided. NYC vocabulary, category balance, and public reporting behavior differ from Indian communities. Hindi, Agriculture, Healthcare, Education, and miscellaneous reports are outside the public model's training coverage. See [data provenance and preparation](../data/README.md).

## Synthetic demonstration

The separate model uses 100 authored examples: 80 train, 20 test, ten categories, English/Hindi. Its held-out accuracy is 100% and macro F1 is 1.000 on that small authored domain. These numbers are displayed with the synthetic warning and must not be cited as real-world performance or multilingual validation. Select the demo explicitly in the lab; it is not the report-assistance model.

## Application behavior

Report assistance stays on local keyword rules by default (`AI_CLASSIFIER_MODE=rules`). Set `AI_CLASSIFIER_MODE=local-model` only after review to opt into the public-data classifier. It falls back to rules when it abstains or when the rule category is outside model coverage. Category suggestions remain editable and require the submitter's acceptance. Urgency stays rule-based. AI never approves reports, reviews evidence, assigns official emergency response, or awards points.

An optional, separately configured remote LLM assistance path already exists. The local AI lab does not use it. Training never reads the application database, and local inference does not persist submitted text as training data.

## Next training cycle

Collect consented, de-identified Indian civic reports and have at least two reviewers resolve labels. Reserve test data by location, time, and near-duplicate group before tuning. Evaluate by language, region, and category, including unsupported and adversarial inputs. Compare word/character TF-IDF linear models and multilingual encoders against this baseline. Calibrate abstention on a separate validation partition, then run a human-reviewed pilot. Public NYC data is useful for the pipeline and a municipal vocabulary baseline; it cannot replace that field evaluation.
