(() => {
    const iconFile = document.getElementById('dialmix_icon_file')
    const iconField = document.getElementById('dialmix_icon')

    if (!iconFile || !iconField)
        return

    const getInput = () => iconField.shadowRoot?.querySelector('input') || iconField

    iconFile.addEventListener('change', () => {
        const file = iconFile.files[0]

        if (!file || (!['image/svg+xml', 'image/png'].includes(file.type) && !/\.(svg|png)$/i.test(file.name)))
            return

        const reader = new FileReader()

        reader.addEventListener('load', () => {
            const input = getInput()

            input.value = String(reader.result || '')
            input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
            input.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
        })

        reader.readAsDataURL(file)
    })
})()