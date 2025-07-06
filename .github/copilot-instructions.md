# Copilot Instructions for Blockchain Project (Blend & Stellar SDK JS)

## Context
Este proyecto utiliza tecnologías blockchain, específicamente Blend y Stellar SDK para JavaScript. El objetivo es desarrollar aplicaciones seguras, eficientes y bien documentadas que interactúen con la red Stellar y/o Blend.

## Reglas Generales
- Usa la doumentación #fetch https://stellar.github.io/js-stellar-sdk/ y la de #fetch https://stellar.github.io/js-stellar-base/index.html
- Ejecuta todo el codigo usando Docker.  docker exec real-estate-pool <command>
- Todo el código debe estar escrito en TypeScript.
- Usa las mejores prácticas de desarrollo para contratos inteligentes y transacciones.
- Incluye comentarios claros y documentación en el código.
- Sigue la convención de nombres camelCase para variables y funciones.
- Utiliza async/await para operaciones asíncronas.
- No incluyas claves privadas, secretos ni información sensible en el código.


## Uso de Blend
- Utiliza las funciones de Blend para interactuar con pools de liquidez y swaps.
- Asegúrate de manejar correctamente los errores y estados de las transacciones.
- Documenta cada función que interactúe con Blend.

## Uso de Stellar SDK JS
- Usa `stellar-sdk` para crear, firmar y enviar transacciones a la red Stellar.
- Valida direcciones y claves públicas antes de usarlas.
- Implementa manejo de errores robusto para todas las operaciones de red.
- Utiliza cuentas de prueba (testnet) para desarrollo y pruebas.

