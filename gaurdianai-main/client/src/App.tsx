import { Box, Container, Heading } from '@chakra-ui/react'

function App() {
  return (
    <Container maxW="container.xl" py={8}>
      <Box textAlign="center">
        <Heading as="h1" size="2xl" mb={4}>
          Guardian AI
        </Heading>
        <Heading as="h2" size="md" color="gray.600">
          AI-powered security system
        </Heading>
      </Box>
    </Container>
  )
}

export default App
