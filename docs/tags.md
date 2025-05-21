# Coffee Map Tag System

This document defines all tags used in the Coffee Map application for filtering and displaying venue features.

## Filter Categories and Tags

| Category      | Display (EN)      | Database Tag       | Description                             |
| ------------- | ----------------- | ------------------ | --------------------------------------- |
| **Coffee**    | Coffee            |                    | Coffee-related filters                  |
|               | Signature Coffee  | `signature_coffee` | Specialty or signature coffee offerings |
|               | Espresso          | `espresso`         | Espresso-based coffee                   |
|               | Hand Drip         | `hand_drip`        | Hand drip/pour-over coffee              |
|               | Cold Brew         | `cold_brew`        | Cold brew coffee                        |
| **Drinks**    | Drinks            |                    | Non-coffee beverages                    |
|               | Non-Coffee Drinks | `non_coffee`       | Tea, juice, and other non-coffee drinks |
|               | Alcoholic Coffee  | `alcoholic_drinks` | Coffee with alcohol or alcoholic drinks |
|               | Plant-Based Milk  | `plant_milk`       | Offers plant-based milk alternatives    |
| **Food**      | Food              |                    | Food options                            |
|               | Brunch            | `brunch`           | Offers brunch menu                      |
|               | Dessert           | `dessert`          | Offers desserts or pastries             |
| **Amenities** | Amenities         |                    | Venue facilities and services           |
|               | Free Wi-Fi        | `free_wifi`        | Provides free Wi-Fi                     |
|               | English Menu      | `english_menu`     | Offers menu in English                  |
|               | Card Payment      | `credit_cards`     | Accepts credit/debit card payments      |
|               | Toilet            | `restroom`         | Has toilet facilities                   |
|               | Instag-Worthy     | `instagram_worthy` | Photogenic space for social media       |
|               | Pet Friendly      | `pet_friendly`     | Allows pets                             |
|               | Outdoor Seating   | `outdoor_seating`  | Provides outdoor seating area           |
|               | Non-Smoking       | `non_smoking`      | No smoking allowed                      |

## Special Filters (Not Tags)

| Display (EN) | Key          | Description                  |
| ------------ | ------------ | ---------------------------- |
| Favourites   | `favourites` | User's saved favorite venues |
| Open Now     | `open`       | Currently open venues        |

## Detail Page Only Tags (Not Filters)

These tags only appear on venue detail pages and are not used as filter options:

| Display (EN) | Database Tag  | Description              |
| ------------ | ------------- | ------------------------ |
| Draft Beer   | `draft_beer`  | Offers craft beer on tap |
| Bottle Shop  | `bottle_shop` | Sells bottled craft beer |

## Notes

1. All database tags should use the exact values from the "Database Tag" column above
2. The tag system supports internationalization through the i18n system
3. When adding new tags, update both this document and the i18n translations
4. Maintain consistency between tag names in the database and translation keys

## 历史标签参考（已过时）

| 类别     | 常见 tag                                        | 解释                               |
| -------- | ----------------------------------------------- | ---------------------------------- |
| 咖啡风格 | `handdrip`, `espresso`, `specialty`, `roastery` | 手冲 / 意式 / 第三波               |
| 餐饮配套 | `breakfast`, `brunch`, `dessert`                | 早午餐 / 甜品                      |
| 特色服务 | `pet_friendly`, `wifi`, `late_night`            | 宠物友好 / 免费 Wi‑Fi / 营业到深夜 |
| 饮品延伸 | `nitro`, `coldbrew`, `pour_over`                | 冷萃氮气等                         |
| 精酿     | `draft_beer`, `bottle_shop`, `takeaway`         | 生啤 / 瓶店 / 可外带               |
