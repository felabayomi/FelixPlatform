import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <>
            <Stack>
                <Stack.Screen name="index" options={{ title: 'A & F Laundry' }} />
                <Stack.Screen name="profile" options={{ title: 'Profile' }} />
                <Stack.Screen name="settings" options={{ title: 'Settings' }} />
                <Stack.Screen name="help" options={{ title: 'Help' }} />
                <Stack.Screen name="info/[slug]" options={{ title: 'A & F Laundry Info' }} />
            </Stack>
            <StatusBar style="auto" />
        </>
    );
}
